const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar, PNG } = require("./helpers");

describe("Eventos", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  describe("Consultar y filtrar", () => {
    test("lista todos los eventos y no manda las imágenes dentro de la lista", async () => {
      const r = await api.llamar("GET", "/eventos");
      assert.equal(r.status, 200);
      assert.ok(r.body.length >= 20);
      assert.ok(JSON.stringify(r.body).length < 200000);
      assert.ok(r.body.every((e) => e.id && e.nombre && e.fecha && Array.isArray(e.tiposEntrada)));
    });

    test("el detalle trae tipos de entrada, categoría y organizador", async () => {
      const r = await api.llamar("GET", "/eventos/1");
      assert.equal(r.status, 200);
      assert.equal(r.body.id, 1);
      assert.ok(r.body.tiposEntrada.length > 0);
      assert.ok(r.body.categoria.nombre);
      assert.ok(r.body.organizador.nombre);
      assert.equal(r.body.organizador.passwordHash, undefined);
    });

    test("un evento que no existe da 404", async () => {
      assert.equal((await api.llamar("GET", "/eventos/999999")).status, 404);
    });

    test("busca por texto sin distinguir mayúsculas ni tildes", async () => {
      const r = await api.llamar("GET", "/eventos?texto=MONOLOGOS");
      assert.ok(r.body.some((e) => e.nombre === "Noche de Monólogos"));
      assert.ok(r.body.every((e) => `${e.nombre} ${e.descripcion}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes("monologos")));
    });

    test("la palabra buscada tiene que empezar una palabra: 'cena' no trae eventos que dicen 'escenarios'", async () => {
      const r = await api.llamar("GET", "/eventos?texto=cena");
      const nombres = r.body.map((e) => e.nombre);
      assert.ok(nombres.includes("Cena Show de Tango"));
      assert.ok(!nombres.includes("Lollapalooza"), "su descripción dice 'escenarios'");
      assert.ok(!nombres.includes("El Principito"), "su descripción dice 'escena'");
    });

    test("buscar el comienzo de una palabra sí funciona, y varias palabras tienen que estar todas", async () => {
      assert.ok((await api.llamar("GET", "/eventos?texto=mono")).body.some((e) => e.nombre === "Noche de Monólogos"));
      const juntas = (await api.llamar("GET", "/eventos?texto=cena tango")).body.map((e) => e.nombre);
      assert.deepEqual(juntas, ["Cena Show de Tango"], "solo el que tiene las dos palabras");
      assert.deepEqual((await api.llamar("GET", "/eventos?texto=cena futbol")).body, []);
    });

    test("los caracteres especiales de una búsqueda no rompen nada", async () => {
      for (const texto of ["(", "[a-z", "a+b", "*", "\\", "?"]) {
        const r = await api.llamar("GET", `/eventos?texto=${encodeURIComponent(texto)}`);
        assert.equal(r.status, 200, `debería aceptar "${texto}"`);
      }
    });

    test("busca también dentro de la descripción", async () => {
      const r = await api.llamar("GET", "/eventos?texto=shakespeare");
      assert.ok(r.body.some((e) => e.nombre === "Hamlet"));
    });

    test("un texto sin resultados devuelve lista vacía", async () => {
      const r = await api.llamar("GET", "/eventos?texto=zzzzzzzzz");
      assert.equal(r.status, 200);
      assert.deepEqual(r.body, []);
    });

    test("filtra por categoría", async () => {
      const categorias = (await api.llamar("GET", "/categorias")).body;
      const teatro = categorias.find((c) => c.nombre === "Teatro");
      const r = await api.llamar("GET", `/eventos?categoriaId=${teatro.id}`);
      assert.ok(r.body.length > 0);
      assert.ok(r.body.every((e) => e.categoria.id === teatro.id));
    });

    test("filtra por rango de precio", async () => {
      const r = await api.llamar("GET", "/eventos?precioMin=100000&precioMax=250000");
      assert.ok(r.body.length > 0);
      assert.ok(r.body.every((e) => e.tiposEntrada.some((t) => t.precio >= 100000 && t.precio <= 250000)));
    });

    test("ordena por fecha, por precio y por puntaje, en los dos sentidos", async () => {
      const porFecha = (await api.llamar("GET", "/eventos?orden=fecha")).body.map((e) => e.fecha);
      assert.deepEqual(porFecha, [...porFecha].sort());

      const desc = (await api.llamar("GET", "/eventos?orden=fecha&direccion=desc")).body.map((e) => e.fecha);
      assert.deepEqual(desc, [...porFecha].reverse());

      const precios = (await api.llamar("GET", "/eventos?orden=precio")).body.map((e) => Math.min(...e.tiposEntrada.map((t) => t.precio)));
      assert.deepEqual(precios, [...precios].sort((a, b) => a - b));

      const r = await api.llamar("GET", "/eventos?orden=puntaje&direccion=desc");
      assert.equal(r.status, 200);
    });

    test("un orden inválido da 400", async () => {
      const r = await api.llamar("GET", "/eventos?orden=color");
      assert.equal(r.status, 400);
    });

    test("las categorías se listan", async () => {
      const r = await api.llamar("GET", "/categorias");
      assert.equal(r.status, 200);
      assert.ok(r.body.length >= 5);
    });
  });

  describe("Crear", () => {
    test("un organizador crea un evento y queda como su dueño", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token, { nombre: "Mi Gran Show" });

      assert.equal(evento.nombre, "Mi Gran Show");
      assert.equal(evento.organizador.id, org.usuario.id);
      assert.equal(evento.tiposEntrada.length, 2);
      assert.deepEqual(evento.tiposEntrada.map((t) => t.id), [1, 2]);
      assert.equal(evento.portada, null);

      const lista = (await api.llamar("GET", "/eventos")).body;
      assert.ok(lista.some((e) => e.id === evento.id));
    });

    test("el organizador del evento sale del token, no del cuerpo del pedido", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const otro = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token, { organizadorId: otro.usuario.id });
      assert.equal(evento.organizador.id, org.usuario.id);
    });

    test("al publicar, el organizador recibe un aviso", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("GET", "/notificaciones", undefined, org.token);
      assert.ok(r.body.notificaciones.some((n) => n.tipo === "EVENTO_PUBLICADO" && n.mensaje.includes(evento.nombre)));
    });

    test("un comprador no puede crear eventos (403) y sin sesión da 401", async () => {
      const comprador = await api.registrar();
      const cuerpo = { nombre: "X", fecha: api.fechaEn(10), categoriaId: 1, lugar: api.LUGAR, tiposEntrada: [{ nombre: "G", precio: 1, cupoDisponible: 1 }] };
      assert.equal((await api.llamar("POST", "/eventos", cuerpo, comprador.token)).status, 403);
      assert.equal((await api.llamar("POST", "/eventos", cuerpo)).status, 401);
    });

    test("valida los datos del evento", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const entrada = { nombre: "G", precio: 100, ubicacion: "Campo", cupoDisponible: 10 };
      const valido = { nombre: "Ok", fecha: api.fechaEn(10), categoriaId: 1, lugar: api.LUGAR, tiposEntrada: [entrada] };

      const casos = [
        [{ ...valido, nombre: "  " }, 400, "nombre vacío"],
        [{ ...valido, fecha: "mañana" }, 400, "fecha con formato inválido"],
        [{ ...valido, fecha: "2026-02-31" }, 400, "fecha que no existe"],
        [{ ...valido, fecha: api.fechaEn(-5) }, 400, "fecha pasada"],
        [{ ...valido, tiposEntrada: [] }, 400, "sin tipos de entrada"],
        [{ ...valido, tiposEntrada: undefined }, 400, "tipos de entrada ausentes"],
        [{ ...valido, tiposEntrada: [{ ...entrada, nombre: "" }] }, 400, "entrada sin nombre"],
        [{ ...valido, tiposEntrada: [{ ...entrada, precio: "100" }] }, 400, "precio como texto"],
        [{ ...valido, tiposEntrada: [{ ...entrada, precio: -1 }] }, 400, "precio negativo"],
        [{ ...valido, tiposEntrada: [{ ...entrada, cupoDisponible: 0 }] }, 400, "cupo cero"],
        [{ ...valido, tiposEntrada: [{ ...entrada, cupoDisponible: 2.5 }] }, 400, "cupo decimal"],
        [{ ...valido, categoriaId: 99999 }, 404, "categoría inexistente"],
        [{ ...valido, portada: "hola" }, 400, "portada que no es imagen"],
      ];

      for (const [cuerpo, esperado, motivo] of casos) {
        const r = await api.llamar("POST", "/eventos", cuerpo, org.token);
        assert.equal(r.status, esperado, `debería rechazar: ${motivo}`);
        assert.ok(r.body.error);
      }
    });

    test("un precio de 0 es válido (evento gratuito)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("POST", "/eventos", { nombre: "Gratis", fecha: api.fechaEn(10), categoriaId: 1, lugar: api.LUGAR, tiposEntrada: [{ nombre: "Libre", precio: 0, ubicacion: "Plaza", cupoDisponible: 100 }] }, org.token);
      assert.equal(r.status, 201);
    });
  });

  describe("Portada", () => {
    test("se guarda y se pide por su propia URL, sin viajar dentro del evento", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token, { portada: PNG });
      assert.equal(evento.portada, `/eventos/${evento.id}/portada`);

      const imagen = await api.llamar("GET", evento.portada);
      assert.equal(imagen.status, 200);
      assert.equal(imagen.headers.get("content-type"), "image/png");
      assert.equal(imagen.body[1], 0x50);

      const detalle = await api.llamar("GET", `/eventos/${evento.id}`);
      assert.equal(detalle.body.portada, `/eventos/${evento.id}/portada`);
    });

    test("un evento sin portada devuelve 404 al pedirla", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      assert.equal((await api.llamar("GET", `/eventos/${evento.id}/portada`)).status, 404);
    });
  });

  describe("Editar", () => {
    test("el dueño cambia nombre, descripción, fecha, categoría y portada", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const categorias = (await api.llamar("GET", "/categorias")).body;
      const otra = categorias.find((c) => c.id !== evento.categoria.id);
      const fecha = api.fechaEn(60);

      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Nombre nuevo", descripcion: "Otra descripción", fecha, categoriaId: otra.id, portada: PNG }, org.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.nombre, "Nombre nuevo");
      assert.equal(r.body.descripcion, "Otra descripción");
      assert.equal(r.body.fecha, fecha);
      assert.equal(r.body.categoria.id, otra.id);
      assert.equal(r.body.portada, `/eventos/${evento.id}/portada`);
    });

    test("se puede quitar la portada", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token, { portada: PNG });
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { portada: null }, org.token);
      assert.equal(r.body.portada, null);
    });

    test("solo el organizador dueño: otro organizador y un comprador reciben 403, sin sesión 401", async () => {
      const dueno = await api.registrar("ORGANIZADOR");
      const otro = await api.registrar("ORGANIZADOR");
      const comprador = await api.registrar();
      const evento = await api.crearEvento(dueno.token);

      assert.equal((await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Hackeado" }, otro.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Hackeado" }, comprador.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Hackeado" })).status, 401);

      const detalle = await api.llamar("GET", `/eventos/${evento.id}`);
      assert.equal(detalle.body.nombre, evento.nombre);
    });

    test("un evento inexistente da 404", async () => {
      const org = await api.registrar("ORGANIZADOR");
      assert.equal((await api.llamar("PUT", "/eventos/999999", { nombre: "x" }, org.token)).status, 404);
    });

    test("valida nombre, fecha, categoría y descripción", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const url = `/eventos/${evento.id}`;

      assert.equal((await api.llamar("PUT", url, { nombre: "   " }, org.token)).status, 400);
      assert.equal((await api.llamar("PUT", url, { fecha: "mañana" }, org.token)).status, 400);
      assert.equal((await api.llamar("PUT", url, { fecha: api.fechaEn(-1) }, org.token)).status, 400);
      assert.equal((await api.llamar("PUT", url, { categoriaId: 99999 }, org.token)).status, 404);
      assert.equal((await api.llamar("PUT", url, { descripcion: 123 }, org.token)).status, 400);
      assert.equal((await api.llamar("PUT", url, { portada: "hola" }, org.token)).status, 400);
    });

    test("edita precio, ubicación y cupo de una entrada existente sin cambiar las demás", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const [general, vip] = evento.tiposEntrada;

      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { tiposEntrada: [{ id: general.id, precio: 1500, ubicacion: "Tribuna", cupoDisponible: 80 }] }, org.token);
      assert.equal(r.status, 200);
      const nueva = r.body.tiposEntrada.find((t) => t.id === general.id);
      assert.equal(nueva.precio, 1500);
      assert.equal(nueva.ubicacion, "Tribuna");
      assert.equal(nueva.cupoDisponible, 80);
      assert.equal(nueva.nombre, general.nombre);
      assert.deepEqual(r.body.tiposEntrada.find((t) => t.id === vip.id), vip);
    });

    test("agrega un tipo de entrada nuevo con el siguiente id", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { tiposEntrada: [{ nombre: "Super VIP", precio: 9000, ubicacion: "Backstage", cupoDisponible: 3 }] }, org.token);

      assert.equal(r.status, 200);
      assert.equal(r.body.tiposEntrada.length, 3);
      assert.equal(r.body.tiposEntrada.at(-1).id, 3);
      assert.equal(r.body.tiposEntrada.at(-1).nombre, "Super VIP");
    });

    test("no quita los tipos de entrada que no se mencionan", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { tiposEntrada: [] }, org.token);
      assert.equal(r.body.tiposEntrada.length, 2);
    });

    test("rechaza entradas inválidas", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const id = evento.tiposEntrada[0].id;
      const url = `/eventos/${evento.id}`;

      assert.equal((await api.llamar("PUT", url, { tiposEntrada: [{ id: 999, precio: 1 }] }, org.token)).status, 400, "entrada que no existe");
      assert.equal((await api.llamar("PUT", url, { tiposEntrada: [{ id, precio: -5 }] }, org.token)).status, 400, "precio negativo");
      assert.equal((await api.llamar("PUT", url, { tiposEntrada: [{ id, cupoDisponible: -1 }] }, org.token)).status, 400, "cupo negativo");
      assert.equal((await api.llamar("PUT", url, { tiposEntrada: [{ id, nombre: " " }] }, org.token)).status, 400, "nombre vacío");
      assert.equal((await api.llamar("PUT", url, { tiposEntrada: [{ nombre: "Nueva", precio: 10, cupoDisponible: 0 }] }, org.token)).status, 400, "entrada nueva sin cupo");
      assert.equal((await api.llamar("PUT", url, { tiposEntrada: "mal" }, org.token)).status, 400, "no es una lista");
    });

    test("si algo es inválido no se aplica ningún cambio (todo o nada)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Cambio válido", tiposEntrada: [{ id: evento.tiposEntrada[0].id, precio: -5 }] }, org.token);
      assert.equal(r.status, 400);

      const detalle = (await api.llamar("GET", `/eventos/${evento.id}`)).body;
      assert.equal(detalle.nombre, evento.nombre);
      assert.equal(detalle.tiposEntrada[0].precio, evento.tiposEntrada[0].precio);
    });

    test("cambiar la fecha avisa a quienes tienen entradas (una vez por persona) y no a los demás", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const compra1 = await api.registrar();
      const compra2 = await api.registrar();
      const sinCompra = await api.registrar();
      await api.comprar(compra1.token, evento);
      await api.comprar(compra1.token, evento, 1); // segunda compra de la misma persona
      await api.comprar(compra2.token, evento);

      const nuevaFecha = api.fechaEn(45);
      await api.llamar("PUT", `/eventos/${evento.id}`, { fecha: nuevaFecha }, org.token);

      const avisos = async (token) => (await api.llamar("GET", "/notificaciones", undefined, token)).body.notificaciones.filter((n) => n.tipo === "EVENTO_MODIFICADO");
      assert.equal((await avisos(compra1.token)).length, 1);
      assert.equal((await avisos(compra2.token)).length, 1);
      assert.equal((await avisos(sinCompra.token)).length, 0);

      const [aviso] = await avisos(compra1.token);
      assert.ok(aviso.mensaje.includes(nuevaFecha.split("-").reverse().join("/")));
    });

    test("cambiar solo el nombre no avisa a nadie", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);

      await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Otro nombre" }, org.token);
      const avisos = (await api.llamar("GET", "/notificaciones", undefined, comprador.token)).body.notificaciones;
      assert.ok(!avisos.some((n) => n.tipo === "EVENTO_MODIFICADO"));
    });

    test("un evento que ya se realizó no se puede editar", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      api.hacerPasarEvento(evento.id);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Tarde" }, org.token);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /ya se realizó/i);
    });
  });

  describe("Eliminar", () => {
    test("elimina un evento sin ventas", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);

      const r = await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.comprasCanceladas, 0);
      assert.equal((await api.llamar("GET", `/eventos/${evento.id}`)).status, 404);
      assert.ok(!(await api.llamar("GET", "/eventos")).body.some((e) => e.id === evento.id));
    });

    test("solo el dueño puede: otro organizador y un comprador reciben 403", async () => {
      const dueno = await api.registrar("ORGANIZADOR");
      const otro = await api.registrar("ORGANIZADOR");
      const comprador = await api.registrar();
      const evento = await api.crearEvento(dueno.token);

      assert.equal((await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, otro.token)).status, 403);
      assert.equal((await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, comprador.token)).status, 403);
      assert.equal((await api.llamar("DELETE", `/eventos/${evento.id}`)).status, 401);
      assert.equal((await api.llamar("GET", `/eventos/${evento.id}`)).status, 200);
    });

    test("cancela las compras pendientes, reembolsa las pagadas y avisa a cada comprador", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const pagador = await api.registrar();
      const reservador = await api.registrar();
      const pagada = await api.comprarYPagar(pagador.token, evento);
      const pendiente = await api.comprar(reservador.token, evento);
      assert.equal(pagada.estado, "CONFIRMADA");

      const r = await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.comprasCanceladas, 2);

      const comprasPagador = (await api.llamar("GET", "/compras", undefined, pagador.token)).body;
      assert.equal(comprasPagador.find((c) => c.id === pagada.id).estado, "REEMBOLSADA");
      const comprasReservador = (await api.llamar("GET", "/compras", undefined, reservador.token)).body;
      assert.equal(comprasReservador.find((c) => c.id === pendiente.id).estado, "CANCELADA");

      const avisoPagador = (await api.llamar("GET", "/notificaciones", undefined, pagador.token)).body.notificaciones.find((n) => n.titulo === "Se canceló tu evento");
      assert.equal(avisoPagador.tipo, "REEMBOLSO");
      const avisoReservador = (await api.llamar("GET", "/notificaciones", undefined, reservador.token)).body.notificaciones.find((n) => n.titulo === "Se canceló tu evento");
      assert.equal(avisoReservador.tipo, "CANCELACION");
    });

    test("lo saca de los favoritos y de la lista del organizador", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const comprador = await api.registrar();
      await api.llamar("POST", `/favoritos/${evento.id}`, undefined, comprador.token);
      assert.equal((await api.llamar("GET", "/favoritos", undefined, comprador.token)).body.length, 1);

      await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token);
      assert.equal((await api.llamar("GET", "/favoritos", undefined, comprador.token)).body.length, 0);
      assert.ok(!api.container.organizadorRepository.findById(org.usuario.id).eventos.some((e) => e.id === evento.id));
    });

    test("un evento ya realizado no se puede eliminar (queda en el historial)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      api.hacerPasarEvento(evento.id);
      const r = await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token);
      assert.equal(r.status, 400);
      assert.equal((await api.llamar("GET", `/eventos/${evento.id}`)).status, 200);
    });

    test("eliminar dos veces: la segunda da 404", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token);
      assert.equal((await api.llamar("DELETE", `/eventos/${evento.id}`, undefined, org.token)).status, 404);
    });
  });
});
