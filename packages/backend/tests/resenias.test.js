const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Reseñas", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  // Un evento ya realizado, con una compra utilizada de un comprador nuevo.
  const escenario = async (organizador) => {
    const org = organizador ?? (await api.registrar("ORGANIZADOR"));
    const evento = await api.crearEvento(org.token);
    const comprador = await api.registrar();
    const compra = await api.comprarYPagar(comprador.token, evento);
    api.container.compraRepository.findById(compra.id).actualizarEstado("UTILIZADA");
    api.hacerPasarEvento(evento.id);
    return { org, evento, comprador, compra };
  };

  test("un comprador puntúa un evento al que fue", async () => {
    const { comprador, compra, evento } = await escenario();
    const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 4, detalle: "Muy bueno" }, comprador.token);

    assert.equal(r.status, 201);
    assert.equal(r.body.puntuacion, 4);
    assert.equal(r.body.detalle, "Muy bueno");
    assert.equal(r.body.evento.id, evento.id);
    assert.equal(r.body.comprador, "Test Usuario");
  });

  test("el comentario se recorta y las puntuaciones válidas son de 1 a 5", async () => {
    for (const puntos of [1, 5]) {
      const { comprador, compra } = await escenario();
      const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: puntos, detalle: "  ok  " }, comprador.token);
      assert.equal(r.status, 201);
      assert.equal(r.body.detalle, "ok");
    }
  });

  test("rechaza puntuaciones fuera de rango o que no son enteros", async () => {
    const { comprador, compra } = await escenario();
    for (const puntuacion of [0, 6, -1, 2.5, "4", undefined]) {
      const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion, detalle: "x" }, comprador.token);
      assert.equal(r.status, 400, `debería rechazar puntuación ${puntuacion}`);
    }
  });

  test("el comentario no puede estar vacío", async () => {
    const { comprador, compra } = await escenario();
    for (const detalle of ["", "   ", undefined, 123]) {
      const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 3, detalle }, comprador.token);
      assert.equal(r.status, 400, `debería rechazar comentario ${JSON.stringify(detalle)}`);
    }
  });

  test("solo se puntúa con la entrada utilizada: una pendiente o confirmada no alcanza", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const evento = await api.crearEvento(org.token);
    const comprador = await api.registrar();
    const pendiente = await api.comprar(comprador.token, evento);
    const confirmada = await api.comprarYPagar(comprador.token, evento);

    for (const compra of [pendiente, confirmada]) {
      const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 5, detalle: "x" }, comprador.token);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /utilizada/i);
    }
  });

  test("una compra que no existe da 404", async () => {
    const comprador = await api.registrar();
    const r = await api.llamar("POST", "/resenias", { compraId: 999999, puntuacion: 5, detalle: "x" }, comprador.token);
    assert.equal(r.status, 404);
  });

  test("no se puede puntuar la compra de otra persona (403)", async () => {
    const { compra } = await escenario();
    const intruso = await api.registrar();
    const r = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 5, detalle: "x" }, intruso.token);
    assert.equal(r.status, 403);
  });

  test("no se puede puntuar dos veces el mismo evento", async () => {
    const { comprador, compra } = await escenario();
    assert.equal((await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 4, detalle: "uno" }, comprador.token)).status, 201);

    const otra = await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 1, detalle: "dos" }, comprador.token);
    assert.equal(otra.status, 400);
    assert.match(otra.body.error, /ya puntuaste/i);
  });

  test("solo los compradores puntúan: un organizador recibe 403 y sin sesión 401", async () => {
    const { org, compra } = await escenario();
    const cuerpo = { compraId: compra.id, puntuacion: 5, detalle: "x" };
    assert.equal((await api.llamar("POST", "/resenias", cuerpo, org.token)).status, 403);
    assert.equal((await api.llamar("POST", "/resenias", cuerpo)).status, 401);
  });

  test("el organizador recibe un aviso de reseña nueva", async () => {
    const { org, comprador, compra, evento } = await escenario();
    await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 5, detalle: "Excelente" }, comprador.token);

    const avisos = (await api.llamar("GET", "/notificaciones", undefined, org.token)).body.notificaciones;
    const aviso = avisos.find((n) => n.tipo === "RESENIA");
    assert.ok(aviso);
    assert.ok(aviso.mensaje.includes(evento.nombre));
    assert.ok(aviso.mensaje.includes("5"));
  });

  describe("Puntaje del organizador", () => {
    test("un organizador sin reseñas tiene puntaje nulo y cero reseñas", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("GET", `/resenias?organizadorId=${org.usuario.id}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.puntajePromedio, null);
      assert.equal(r.body.cantidad, 0);
      assert.deepEqual(r.body.resenias, []);
    });

    test("calcula el promedio y la cantidad con todas sus reseñas", async () => {
      const org = await api.registrar("ORGANIZADOR");
      for (const puntos of [5, 4, 3]) {
        const { comprador, compra } = await escenario(org);
        await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: puntos, detalle: `Puntos ${puntos}` }, comprador.token);
      }

      const r = await api.llamar("GET", `/resenias?organizadorId=${org.usuario.id}`);
      assert.equal(r.body.cantidad, 3);
      assert.equal(r.body.puntajePromedio, 4);
      assert.equal(r.body.resenias.length, 3);
      assert.ok(r.body.resenias.every((x) => x.evento.nombre && x.comprador && x.detalle));
    });

    test("las reseñas de un organizador no se mezclan con las de otro", async () => {
      const a = await api.registrar("ORGANIZADOR");
      const b = await api.registrar("ORGANIZADOR");
      const { comprador, compra } = await escenario(a);
      await api.llamar("POST", "/resenias", { compraId: compra.id, puntuacion: 2, detalle: "Flojo" }, comprador.token);

      assert.equal((await api.llamar("GET", `/resenias?organizadorId=${a.usuario.id}`)).body.cantidad, 1);
      assert.equal((await api.llamar("GET", `/resenias?organizadorId=${b.usuario.id}`)).body.cantidad, 0);
    });

    test("un organizador que no existe da 404", async () => {
      assert.equal((await api.llamar("GET", "/resenias?organizadorId=999999")).status, 404);
    });

    test("sin filtro, devuelve todas las reseñas", async () => {
      const r = await api.llamar("GET", "/resenias");
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.body));
      assert.ok(r.body.length >= 20);
    });

    test("ordenar eventos por puntaje pone primero a los mejor puntuados", async () => {
      const mejor = await api.registrar("ORGANIZADOR");
      const peor = await api.registrar("ORGANIZADOR");
      const eventoMejor = (await escenario(mejor));
      const eventoPeor = (await escenario(peor));
      await api.llamar("POST", "/resenias", { compraId: eventoMejor.compra.id, puntuacion: 5, detalle: "Genial" }, eventoMejor.comprador.token);
      await api.llamar("POST", "/resenias", { compraId: eventoPeor.compra.id, puntuacion: 1, detalle: "Malo" }, eventoPeor.comprador.token);

      const lista = (await api.llamar("GET", "/eventos?orden=puntaje&direccion=desc")).body;
      const posicion = (id) => lista.findIndex((e) => e.id === id);
      assert.ok(posicion(eventoMejor.evento.id) < posicion(eventoPeor.evento.id));
    });
  });
});
