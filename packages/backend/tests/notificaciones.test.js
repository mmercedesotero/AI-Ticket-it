const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Notificaciones", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  const obtener = async (token) => (await api.llamar("GET", "/notificaciones", undefined, token)).body;
  const unEvento = (cambios) => api.registrar("ORGANIZADOR").then(async (org) => ({ org, evento: await api.crearEvento(org.token, cambios) }));

  describe("Lista y lectura", () => {
    test("sin sesión da 401", async () => {
      assert.equal((await api.llamar("GET", "/notificaciones")).status, 401);
      assert.equal((await api.llamar("PUT", "/notificaciones/leidas")).status, 401);
    });

    test("una cuenta nueva no tiene avisos", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("GET", "/notificaciones", undefined, token);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body, { notificaciones: [], noLeidas: 0 });
    });

    test("los avisos llegan sin leer, con el contador y los más nuevos primero", async () => {
      const { evento } = await unEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token);
      await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token);

      const { notificaciones, noLeidas } = await obtener(comprador.token);
      assert.equal(noLeidas, 2);
      assert.deepEqual(notificaciones.map((n) => n.tipo), ["PAGO_CONFIRMADO", "COMPRA"]);
      assert.ok(notificaciones.every((n) => n.leida === false && n.titulo && n.mensaje && n.fechaHora));
    });

    test("marca un aviso como leído y baja el contador", async () => {
      const { evento } = await unEvento();
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);
      const { notificaciones } = await obtener(comprador.token);

      const r = await api.llamar("PUT", `/notificaciones/${notificaciones[0].id}/leida`, undefined, comprador.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.noLeidas, 0);
      assert.equal(r.body.notificaciones[0].leida, true);
    });

    test("marca todos como leídos", async () => {
      const { evento } = await unEvento();
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);
      await api.comprar(comprador.token, evento);
      assert.equal((await obtener(comprador.token)).noLeidas, 2);

      const r = await api.llamar("PUT", "/notificaciones/leidas", undefined, comprador.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.noLeidas, 0);
      assert.ok(r.body.notificaciones.every((n) => n.leida));
    });

    test("un aviso que no existe o es de otra persona da 404", async () => {
      const { evento } = await unEvento();
      const a = await api.registrar();
      const b = await api.registrar();
      await api.comprar(a.token, evento);
      const { notificaciones } = await obtener(a.token);

      assert.equal((await api.llamar("PUT", "/notificaciones/999999/leida", undefined, a.token)).status, 404);
      assert.equal((await api.llamar("PUT", `/notificaciones/${notificaciones[0].id}/leida`, undefined, b.token)).status, 404);
      assert.equal((await obtener(a.token)).noLeidas, 1, "el aviso de A sigue sin leer");
    });

    test("cada persona ve solo sus avisos, aunque sean del mismo evento", async () => {
      const { evento } = await unEvento();
      const a = await api.registrar();
      const b = await api.registrar();
      await api.comprar(a.token, evento);
      assert.equal((await obtener(b.token)).notificaciones.length, 0);
    });

    test("comprador y organizador no mezclan sus avisos aunque tengan el mismo número de id", async () => {
      const { org, evento } = await unEvento();
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);

      const avisosOrg = (await obtener(org.token)).notificaciones;
      assert.ok(avisosOrg.every((n) => n.rol === "ORGANIZADOR"));
      const avisosComprador = (await obtener(comprador.token)).notificaciones;
      assert.ok(avisosComprador.every((n) => n.rol === "COMPRADOR"));
    });
  });

  describe("Recordatorios del comprador", () => {
    test("un día antes avisa 'mañana es tu evento', sin repetirse", async () => {
      const { evento } = await unEvento({ fecha: api.fechaEn(1) });
      const comprador = await api.registrar();
      await api.comprarYPagar(comprador.token, evento);

      await obtener(comprador.token);
      const { notificaciones } = await obtener(comprador.token);
      const avisos = notificaciones.filter((n) => n.tipo === "RECORDATORIO");
      assert.equal(avisos.length, 1);
      assert.equal(avisos[0].titulo, "Tu evento es mañana");
      assert.ok(avisos[0].mensaje.includes(evento.nombre));
    });

    test("el mismo día avisa 'tu evento es hoy'", async () => {
      const { evento } = await unEvento({ fecha: api.fechaEn(0) });
      const comprador = await api.registrar();
      await api.comprarYPagar(comprador.token, evento);

      const avisos = (await obtener(comprador.token)).notificaciones.filter((n) => n.tipo === "RECORDATORIO");
      assert.equal(avisos.length, 1);
      assert.match(avisos[0].titulo, /hoy/i);
    });

    test("solo para entradas confirmadas: una reserva sin pagar no genera recordatorio", async () => {
      const { evento } = await unEvento({ fecha: api.fechaEn(1) });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);
      assert.ok(!(await obtener(comprador.token)).notificaciones.some((n) => n.tipo === "RECORDATORIO"));
    });

    test("un evento lejano no genera recordatorio", async () => {
      const { evento } = await unEvento({ fecha: api.fechaEn(20) });
      const comprador = await api.registrar();
      await api.comprarYPagar(comprador.token, evento);
      assert.ok(!(await obtener(comprador.token)).notificaciones.some((n) => n.tipo === "RECORDATORIO"));
    });
  });

  describe("Avisos del organizador", () => {
    test("la víspera avisa que mañana es su evento, con lo vendido y lo que queda", async () => {
      const { org, evento } = await unEvento({ fecha: api.fechaEn(1) });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento, 0, 3);

      const avisos = (await obtener(org.token)).notificaciones.filter((n) => n.tipo === "RECORDATORIO");
      assert.equal(avisos.length, 1);
      assert.equal(avisos[0].titulo, "Mañana es tu evento");
      assert.ok(avisos[0].mensaje.includes("Vendiste 3 entradas"));
      assert.ok(avisos[0].mensaje.includes("quedan 52"));
    });

    test("el mismo día avisa que hoy es su evento", async () => {
      const { org } = await unEvento({ fecha: api.fechaEn(0) });
      const avisos = (await obtener(org.token)).notificaciones.filter((n) => n.tipo === "RECORDATORIO");
      assert.equal(avisos.length, 1);
      assert.match(avisos[0].titulo, /hoy/i);
    });

    test("avisa cuando quedan pocas entradas (20 o menos), una sola vez", async () => {
      const { org, evento } = await unEvento({
        tiposEntrada: [{ nombre: "Única", precio: 100, ubicacion: "Sala", cupoDisponible: 25 }],
      });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento, 0, 4);
      assert.ok(!(await obtener(org.token)).notificaciones.some((n) => n.tipo === "POCAS_ENTRADAS"), "quedan 21");

      await api.comprar(comprador.token, evento, 0, 1); // quedan 20
      await obtener(org.token);
      const avisos = (await obtener(org.token)).notificaciones.filter((n) => n.tipo === "POCAS_ENTRADAS");
      assert.equal(avisos.length, 1);
      assert.ok(avisos[0].mensaje.includes("20"));
    });

    test("un evento agotado avisa 'agotado' y no 'pocas entradas'", async () => {
      const { org, evento } = await unEvento({
        tiposEntrada: [{ nombre: "Única", precio: 100, ubicacion: "Sala", cupoDisponible: 2 }],
      });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento, 0, 2);

      const tipos = (await obtener(org.token)).notificaciones.map((n) => n.tipo);
      assert.ok(tipos.includes("EVENTO_AGOTADO"));
      assert.ok(!tipos.includes("POCAS_ENTRADAS"));
    });

    test("avisa si falta una semana o menos y todavía no hay ventas; con ventas no", async () => {
      const sinVentas = await unEvento({ fecha: api.fechaEn(5) });
      const conVentas = await unEvento({ fecha: api.fechaEn(5) });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, conVentas.evento);

      const avisoSin = (await obtener(sinVentas.org.token)).notificaciones.find((n) => n.tipo === "SIN_VENTAS");
      assert.ok(avisoSin);
      assert.ok(avisoSin.mensaje.includes("5 días"));
      assert.ok(!(await obtener(conVentas.org.token)).notificaciones.some((n) => n.tipo === "SIN_VENTAS"));
    });

    test("un evento lejano sin ventas todavía no genera aviso", async () => {
      const { org } = await unEvento({ fecha: api.fechaEn(40) });
      assert.ok(!(await obtener(org.token)).notificaciones.some((n) => n.tipo === "SIN_VENTAS"));
    });

    test("los avisos de un organizador no llegan a otro", async () => {
      const a = await unEvento({ fecha: api.fechaEn(1) });
      const b = await api.registrar("ORGANIZADOR");
      assert.ok((await obtener(a.org.token)).notificaciones.some((n) => n.tipo === "RECORDATORIO"));
      assert.ok(!(await obtener(b.token)).notificaciones.some((n) => n.tipo === "RECORDATORIO"));
    });
  });
});
