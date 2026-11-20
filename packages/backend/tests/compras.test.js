const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Compras, pagos y reservas", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  // Un evento nuevo con su organizador, para que cada test arranque limpio.
  const prepararEvento = async (cambios) => {
    const org = await api.registrar("ORGANIZADOR");
    const evento = await api.crearEvento(org.token, cambios);
    return { org, evento };
  };
  const cupoDe = async (evento, indice = 0) => (await api.llamar("GET", `/eventos/${evento.id}`)).body.tiposEntrada[indice].cupoDisponible;
  const notificaciones = async (token) => (await api.llamar("GET", "/notificaciones", undefined, token)).body.notificaciones;

  describe("Comprar", () => {
    test("crea la compra pendiente de pago, calcula el total y descuenta el cupo", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();

      const r = await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: evento.tiposEntrada[0].id, cantidad: 3 }, comprador.token);
      assert.equal(r.status, 201);
      assert.equal(r.body.estado, "PENDIENTE_PAGO");
      assert.equal(r.body.cantidad, 3);
      assert.equal(r.body.total, 3000);
      assert.equal(r.body.comprador.id, comprador.usuario.id);
      assert.equal(r.body.evento.id, evento.id);
      assert.equal(await cupoDe(evento), 47);
    });

    test("el comprador sale del token, no del cuerpo del pedido", async () => {
      const { evento } = await prepararEvento();
      const yo = await api.registrar();
      const otro = await api.registrar();
      const r = await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: 1, cantidad: 1, usuarioId: otro.usuario.id }, yo.token);
      assert.equal(r.body.comprador.id, yo.usuario.id);
    });

    test("la compra queda en el historial con su estado inicial", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      assert.equal(compra.historial.length, 1);
      assert.equal(compra.historial[0].estado, "PENDIENTE_PAGO");
      assert.ok(compra.historial[0].fechaHora);
    });

    test("solo los compradores compran: un organizador recibe 403 y sin sesión 401", async () => {
      const { org, evento } = await prepararEvento();
      const cuerpo = { eventoId: evento.id, entradaId: 1, cantidad: 1 };
      assert.equal((await api.llamar("POST", "/compras", cuerpo, org.token)).status, 403);
      assert.equal((await api.llamar("POST", "/compras", cuerpo)).status, 401);
    });

    test("valida evento, entrada y cantidad", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const id = evento.tiposEntrada[0].id;

      const casos = [
        [{ eventoId: 999999, entradaId: id, cantidad: 1 }, 404, "evento inexistente"],
        [{ eventoId: evento.id, entradaId: 999, cantidad: 1 }, 404, "entrada inexistente"],
        [{ eventoId: evento.id, entradaId: id, cantidad: 0 }, 400, "cantidad cero"],
        [{ eventoId: evento.id, entradaId: id, cantidad: -2 }, 400, "cantidad negativa"],
        [{ eventoId: evento.id, entradaId: id, cantidad: 1.5 }, 400, "cantidad decimal"],
        [{ eventoId: evento.id, entradaId: id, cantidad: "2" }, 400, "cantidad como texto"],
        [{ eventoId: evento.id, entradaId: id }, 400, "sin cantidad"],
      ];
      for (const [cuerpo, esperado, motivo] of casos) {
        const r = await api.llamar("POST", "/compras", cuerpo, comprador.token);
        assert.equal(r.status, esperado, `debería rechazar: ${motivo}`);
      }
      assert.equal(await cupoDe(evento), 50, "ningún intento fallido descuenta cupo");
    });

    test("no vende más entradas que el cupo", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();

      const r = await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: evento.tiposEntrada[1].id, cantidad: 6 }, comprador.token); // VIP tiene 5
      assert.equal(r.status, 400);
      assert.match(r.body.error, /cupo/i);

      assert.equal((await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: evento.tiposEntrada[1].id, cantidad: 5 }, comprador.token)).status, 201);
      assert.equal(await cupoDe(evento, 1), 0);
      assert.equal((await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: evento.tiposEntrada[1].id, cantidad: 1 }, comprador.token)).status, 400);
    });

    test("no se puede comprar un evento que ya se realizó", async () => {
      const { evento } = await prepararEvento();
      api.hacerPasarEvento(evento.id);
      const comprador = await api.registrar();
      const r = await api.llamar("POST", "/compras", { eventoId: evento.id, entradaId: 1, cantidad: 1 }, comprador.token);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /ya se realizó/i);
    });

    test("al comprar, el comprador recibe un aviso", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "COMPRA" && n.mensaje.includes(evento.nombre)));
    });

    test("cuando se agotan todas las entradas, el organizador recibe el aviso de evento agotado", async () => {
      const { org, evento } = await prepararEvento({
        tiposEntrada: [{ nombre: "Única", precio: 100, ubicacion: "Sala", cupoDisponible: 2 }],
      });
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento, 0, 1);
      assert.ok(!(await notificaciones(org.token)).some((n) => n.tipo === "EVENTO_AGOTADO"), "todavía queda 1");

      await api.comprar(comprador.token, evento, 0, 1);
      assert.ok((await notificaciones(org.token)).some((n) => n.tipo === "EVENTO_AGOTADO" && n.mensaje.includes(evento.nombre)));
    });
  });

  describe("Consultar compras", () => {
    test("cada comprador ve solo las suyas", async () => {
      const { evento } = await prepararEvento();
      const a = await api.registrar();
      const b = await api.registrar();
      const compraA = await api.comprar(a.token, evento);
      await api.comprar(b.token, evento);

      const r = await api.llamar("GET", "/compras", undefined, a.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.length, 1);
      assert.equal(r.body[0].id, compraA.id);
    });

    test("el organizador necesita indicar el evento y solo ve las ventas de los suyos", async () => {
      const { org, evento } = await prepararEvento();
      const otro = await api.registrar("ORGANIZADOR");
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento, 0, 2);
      await api.comprarYPagar(comprador.token, evento, 0, 1);

      assert.equal((await api.llamar("GET", "/compras", undefined, org.token)).status, 400, "sin eventoId");
      assert.equal((await api.llamar("GET", `/compras?eventoId=${evento.id}`, undefined, otro.token)).status, 403, "evento de otro");

      const r = await api.llamar("GET", `/compras?eventoId=${evento.id}`, undefined, org.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.evento.id, evento.id);
      assert.equal(r.body.compras.length, 2);
      assert.equal(r.body.entradasDisponibles.find((t) => t.id === 1).cupoDisponible, 47);
      assert.equal(r.body.compras[0].comprador, "Test Usuario");
    });

    test("el detalle de una compra lo ven su comprador y el organizador del evento, nadie más", async () => {
      const { org, evento } = await prepararEvento();
      const otroOrg = await api.registrar("ORGANIZADOR");
      const comprador = await api.registrar();
      const intruso = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const url = `/compras/${compra.id}`;

      assert.equal((await api.llamar("GET", url, undefined, comprador.token)).status, 200);
      assert.equal((await api.llamar("GET", url, undefined, org.token)).status, 200);
      assert.equal((await api.llamar("GET", url, undefined, intruso.token)).status, 403);
      assert.equal((await api.llamar("GET", url, undefined, otroOrg.token)).status, 403);
      assert.equal((await api.llamar("GET", url)).status, 401);
      assert.equal((await api.llamar("GET", "/compras/999999", undefined, comprador.token)).status, 404);
    });
  });

  describe("Pagar", () => {
    test("confirma la compra, registra el cambio en el historial y avisa", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token);

      const r = await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, "CONFIRMADA");
      assert.deepEqual(r.body.historial.map((h) => h.estado), ["PENDIENTE_PAGO", "CONFIRMADA"]);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "PAGO_CONFIRMADO"));
    });

    test("hay que elegir una tarjeta", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, {}, comprador.token)).status, 400);
    });

    test("no se puede pagar con una tarjeta que no es tuya", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const otro = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaAjena = await api.guardarTarjeta(otro.token, "5555555555554444");

      const r = await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId: tarjetaAjena }, comprador.token);
      assert.equal(r.status, 404);
      const estado = (await api.llamar("GET", `/compras/${compra.id}`, undefined, comprador.token)).body.estado;
      assert.equal(estado, "PENDIENTE_PAGO");
    });

    test("una tarjeta que termina en 0000 se rechaza, avisa y la compra sigue pendiente", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token, "4000000000000000");

      const r = await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /rechazado/i);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "PAGO_RECHAZADO"));

      const estado = (await api.llamar("GET", `/compras/${compra.id}`, undefined, comprador.token)).body.estado;
      assert.equal(estado, "PENDIENTE_PAGO");
    });

    test("tras un rechazo se puede reintentar con otra tarjeta", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const mala = await api.guardarTarjeta(comprador.token, "4000000000000000");
      const buena = await api.guardarTarjeta(comprador.token, "5555555555554444");

      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId: mala }, comprador.token)).status, 400);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId: buena }, comprador.token)).body.estado, "CONFIRMADA");
    });

    test("no se puede pagar dos veces la misma compra", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprarYPagar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token, "5555555555554444");
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token)).status, 400);
    });

    test("solo el dueño paga: otro comprador recibe 403 y un organizador también", async () => {
      const { org, evento } = await prepararEvento();
      const comprador = await api.registrar();
      const intruso = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(intruso.token);

      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, intruso.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, org.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId })).status, 401);
    });

    test("no se puede pagar la compra de un evento que ya se realizó", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token);
      api.hacerPasarEvento(evento.id);

      const r = await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token);
      assert.equal(r.status, 400);
    });
  });

  describe("Cancelar", () => {
    test("una compra sin pagar pasa a CANCELADA y devuelve el cupo", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento, 0, 4);
      assert.equal(await cupoDe(evento), 46);

      const r = await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, "CANCELADA");
      assert.equal(await cupoDe(evento), 50);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "CANCELACION"));
    });

    test("una compra ya pagada pasa a REEMBOLSADA, devuelve el cupo y avisa del reembolso", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprarYPagar(comprador.token, evento, 0, 2);

      const r = await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token);
      assert.equal(r.body.estado, "REEMBOLSADA");
      assert.deepEqual(r.body.historial.map((h) => h.estado), ["PENDIENTE_PAGO", "CONFIRMADA", "REEMBOLSADA"]);
      assert.equal(await cupoDe(evento), 50);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "REEMBOLSO"));
    });

    test("no se cancela dos veces", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token)).status, 400);
    });

    test("no se cancela una compra ya utilizada", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprarYPagar(comprador.token, evento);
      api.container.compraRepository.findById(compra.id).actualizarEstado("UTILIZADA");
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token)).status, 400);
    });

    test("no se cancela la compra de un evento que ya se realizó", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprarYPagar(comprador.token, evento);
      api.hacerPasarEvento(evento.id);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, comprador.token)).status, 400);
    });

    test("solo el dueño cancela: otro comprador y un organizador reciben 403", async () => {
      const { org, evento } = await prepararEvento();
      const comprador = await api.registrar();
      const intruso = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);

      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, intruso.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`, undefined, org.token)).status, 403);
      assert.equal((await api.llamar("PUT", `/compras/${compra.id}/cancelar`)).status, 401);
    });
  });

  describe("Reservas sin pagar", () => {
    // Envejece una compra: hace como si se hubiera reservado hace N horas.
    const envejecer = (compraId, horas) => {
      const compra = api.container.compraRepository.findById(compraId);
      compra.historial[0].fechaHora = new Date(Date.now() - horas * 60 * 60 * 1000);
    };

    test("una reserva reciente no recibe aviso ni se cancela", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      envejecer(compra.id, 2);

      const lista = (await api.llamar("GET", "/compras", undefined, comprador.token)).body;
      assert.equal(lista[0].estado, "PENDIENTE_PAGO");
      assert.ok(!(await notificaciones(comprador.token)).some((n) => n.tipo === "RECORDATORIO_PAGO"));
    });

    test("pasadas 12 horas llega el aviso de abonar, una sola vez", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      envejecer(compra.id, 13);

      await api.llamar("GET", "/compras", undefined, comprador.token);
      await api.llamar("GET", "/compras", undefined, comprador.token);
      const avisos = (await notificaciones(comprador.token)).filter((n) => n.tipo === "RECORDATORIO_PAGO");
      assert.equal(avisos.length, 1);
      assert.ok(avisos[0].mensaje.includes(evento.nombre));

      const lista = (await api.llamar("GET", "/compras", undefined, comprador.token)).body;
      assert.equal(lista[0].estado, "PENDIENTE_PAGO", "todavía no venció");
    });

    test("pasadas 24 horas se cancela sola, devuelve el cupo y avisa", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento, 0, 5);
      assert.equal(await cupoDe(evento), 45);
      envejecer(compra.id, 25);

      const lista = (await api.llamar("GET", "/compras", undefined, comprador.token)).body;
      assert.equal(lista.find((c) => c.id === compra.id).estado, "CANCELADA");
      assert.equal(await cupoDe(evento), 50);
      assert.ok((await notificaciones(comprador.token)).some((n) => n.tipo === "RESERVA_VENCIDA" && n.mensaje.includes(evento.nombre)));
    });

    test("también se revisa al consultar las notificaciones", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      envejecer(compra.id, 30);

      const avisos = await notificaciones(comprador.token);
      assert.ok(avisos.some((n) => n.tipo === "RESERVA_VENCIDA"));
      assert.equal(api.container.compraRepository.findById(compra.id).estado, "CANCELADA");
    });

    test("no se puede pagar una reserva vencida", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprar(comprador.token, evento);
      const tarjetaId = await api.guardarTarjeta(comprador.token);
      envejecer(compra.id, 26);

      const r = await api.llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, comprador.token);
      assert.equal(r.status, 400);
      assert.match(r.body.error, /venció/i);
      assert.equal(api.container.compraRepository.findById(compra.id).estado, "CANCELADA");
    });

    test("una compra ya pagada nunca vence, aunque sea vieja", async () => {
      const { evento } = await prepararEvento();
      const comprador = await api.registrar();
      const compra = await api.comprarYPagar(comprador.token, evento);
      envejecer(compra.id, 100);

      const lista = (await api.llamar("GET", "/compras", undefined, comprador.token)).body;
      assert.equal(lista.find((c) => c.id === compra.id).estado, "CONFIRMADA");
    });
  });
});
