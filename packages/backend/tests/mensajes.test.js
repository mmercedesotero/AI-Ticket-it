const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Chat y mensajes", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  // Un organizador, un evento y un comprador con una compra: es lo necesario para tener un chat.
  const escenario = async () => {
    const org = await api.registrar("ORGANIZADOR");
    const evento = await api.crearEvento(org.token);
    const comprador = await api.registrar();
    const compra = await api.comprar(comprador.token, evento);
    return { org, evento, comprador, compra, url: `/compras/${compra.id}/mensajes` };
  };
  const escribir = (url, texto, token) => api.llamar("POST", url, { texto }, token);
  const avisos = async (token) => (await api.llamar("GET", "/notificaciones", undefined, token)).body.notificaciones.filter((n) => n.tipo === "NUEVO_MENSAJE");
  const chats = async (token) => (await api.llamar("GET", "/compras/chats", undefined, token)).body;

  describe("Enviar y leer", () => {
    test("el comprador y el organizador intercambian mensajes", async () => {
      const { org, comprador, url } = await escenario();

      const m1 = await escribir(url, "Hola, ¿a qué hora abren?", comprador.token);
      assert.equal(m1.status, 201);
      assert.equal(m1.body.texto, "Hola, ¿a qué hora abren?");
      assert.equal(m1.body.autor.rol, "COMPRADOR");

      const m2 = await escribir(url, "A las 20.", org.token);
      assert.equal(m2.body.autor.rol, "ORGANIZADOR");

      const lista = await api.llamar("GET", url, undefined, comprador.token);
      assert.equal(lista.status, 200);
      assert.deepEqual(lista.body.map((m) => m.texto), ["Hola, ¿a qué hora abren?", "A las 20."]);
      assert.deepEqual(lista.body.map((m) => m.id), [1, 2]);
    });

    test("el autor y su rol salen del token, no del cuerpo del pedido", async () => {
      const { comprador, url } = await escenario();
      const r = await api.llamar("POST", url, { texto: "Hola", autorId: 999, rol: "ORGANIZADOR" }, comprador.token);
      assert.equal(r.status, 201);
      assert.equal(r.body.autor.rol, "COMPRADOR");
      assert.equal(r.body.autor.id, comprador.usuario.id);
    });

    test("el texto se recorta y no puede estar vacío", async () => {
      const { comprador, url } = await escenario();
      assert.equal((await escribir(url, "  hola  ", comprador.token)).body.texto, "hola");
      for (const texto of ["", "   ", undefined, 123]) {
        assert.equal((await escribir(url, texto, comprador.token)).status, 400, `debería rechazar ${JSON.stringify(texto)}`);
      }
    });

    test("solo participan el comprador y el organizador del evento: los demás reciben 403", async () => {
      const { url } = await escenario();
      const intruso = await api.registrar();
      const otroOrg = await api.registrar("ORGANIZADOR");

      for (const { token } of [intruso, otroOrg]) {
        assert.equal((await api.llamar("GET", url, undefined, token)).status, 403);
        assert.equal((await escribir(url, "hola", token)).status, 403);
      }
      assert.equal((await api.llamar("GET", url)).status, 401);
      assert.equal((await escribir(url, "hola")).status, 401);
    });

    test("una compra que no existe da 404", async () => {
      const { comprador } = await escenario();
      assert.equal((await api.llamar("GET", "/compras/999999/mensajes", undefined, comprador.token)).status, 404);
    });
  });

  describe("Avisos de mensaje nuevo", () => {
    test("al escribirle al organizador le llega un aviso con quién escribió y por qué evento", async () => {
      const { org, comprador, evento, compra, url } = await escenario();
      await escribir(url, "Hola, ¿se puede entrar con mochila?", comprador.token);

      const [aviso] = await avisos(org.token);
      assert.ok(aviso);
      assert.equal(aviso.titulo, "Nuevo mensaje de Test Usuario");
      assert.ok(aviso.mensaje.includes(evento.nombre));
      assert.ok(aviso.mensaje.includes("mochila"));
      assert.equal(aviso.compraId, compra.id);
      assert.equal(aviso.leida, false);
      assert.equal(aviso.rol, "ORGANIZADOR");
    });

    test("al responder, el aviso le llega al comprador", async () => {
      const { org, comprador, compra, url } = await escenario();
      await escribir(url, "Hola", comprador.token);
      await escribir(url, "Hola, ¡sí!", org.token);

      const [aviso] = await avisos(comprador.token);
      assert.ok(aviso);
      assert.equal(aviso.compraId, compra.id);
      assert.equal(aviso.rol, "COMPRADOR");
      assert.equal((await avisos(comprador.token)).length, 1);
    });

    test("quien escribe no recibe aviso de su propio mensaje", async () => {
      const { comprador, url } = await escenario();
      await escribir(url, "Hola", comprador.token);
      assert.equal((await avisos(comprador.token)).length, 0);
    });

    test("varios mensajes seguidos actualizan el mismo aviso en vez de crear uno por mensaje", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "Primero", comprador.token);
      await escribir(url, "Segundo", comprador.token);
      await escribir(url, "Tercero", comprador.token);

      const lista = await avisos(org.token);
      assert.equal(lista.length, 1);
      assert.ok(lista[0].mensaje.includes("Tercero"));
    });

    test("un mensaje largo se resume en el aviso", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "a".repeat(300), comprador.token);
      const [aviso] = await avisos(org.token);
      assert.ok(aviso.mensaje.length < 200);
      assert.ok(aviso.mensaje.includes("…"));
    });

    test("después de leer el aviso, un mensaje nuevo crea otro aviso", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "Uno", comprador.token);
      await api.llamar("GET", url, undefined, org.token); // el organizador abre el chat
      await escribir(url, "Dos", comprador.token);

      const lista = await avisos(org.token);
      assert.equal(lista.length, 2);
      assert.equal(lista.filter((n) => !n.leida).length, 1);
    });

    test("cada chat tiene su propio aviso", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const a = await api.registrar();
      const b = await api.registrar();
      const compraA = await api.comprar(a.token, evento);
      const compraB = await api.comprar(b.token, evento);

      await escribir(`/compras/${compraA.id}/mensajes`, "Soy A", a.token);
      await escribir(`/compras/${compraB.id}/mensajes`, "Soy B", b.token);
      assert.equal((await avisos(org.token)).length, 2);
    });
  });

  describe("Bandeja de chats y no leídos", () => {
    test("sin mensajes no hay chats", async () => {
      const { comprador, org } = await escenario();
      assert.deepEqual(await chats(comprador.token), []);
      assert.deepEqual(await chats(org.token), []);
    });

    test("cada lado ve el chat con la otra persona, el evento y el último mensaje", async () => {
      const { org, comprador, evento, compra, url } = await escenario();
      await escribir(url, "Hola", comprador.token);
      await escribir(url, "Chau", org.token);

      const [delComprador] = await chats(comprador.token);
      assert.equal(delComprador.compraId, compra.id);
      assert.equal(delComprador.evento.nombre, evento.nombre);
      assert.equal(delComprador.contraparte.nombre, org.usuario.nombre);
      assert.equal(delComprador.contraparte.esOrganizacion, true);
      assert.equal(delComprador.ultimoMensaje.texto, "Chau");
      assert.equal(delComprador.ultimoMensaje.autorRol, "ORGANIZADOR");

      const [delOrganizador] = await chats(org.token);
      assert.equal(delOrganizador.contraparte.nombre, "Test Usuario");
      assert.equal(delOrganizador.contraparte.esOrganizacion, false);
    });

    test("cuenta los mensajes sin leer de la otra persona; los propios no cuentan", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "Uno", comprador.token);
      await escribir(url, "Dos", comprador.token);

      assert.equal((await chats(org.token))[0].noLeidos, 2);
      assert.equal((await chats(comprador.token))[0].noLeidos, 0, "los que escribí yo ya los leí");

      await escribir(url, "Respuesta", org.token);
      assert.equal((await chats(comprador.token))[0].noLeidos, 1);
      assert.equal((await chats(org.token))[0].noLeidos, 0, "al responder, el organizador queda al día");
    });

    test("abrir el chat lo deja al día y marca como leído su aviso", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "Uno", comprador.token);
      await escribir(url, "Dos", comprador.token);

      await api.llamar("GET", url, undefined, org.token);
      assert.equal((await chats(org.token))[0].noLeidos, 0);
      assert.equal((await avisos(org.token))[0].leida, true);
    });

    test("abrir el chat de uno no deja leído el del otro", async () => {
      const { org, comprador, url } = await escenario();
      await escribir(url, "Hola", comprador.token);
      await escribir(url, "Hola, ¿qué tal?", org.token);

      await api.llamar("GET", url, undefined, org.token);
      assert.equal((await chats(comprador.token))[0].noLeidos, 1);
    });

    test("ordena los chats con el más reciente primero", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const a = await api.registrar();
      const b = await api.registrar();
      const compraA = await api.comprar(a.token, evento);
      const compraB = await api.comprar(b.token, evento);

      await escribir(`/compras/${compraA.id}/mensajes`, "Primero A", a.token);
      await escribir(`/compras/${compraB.id}/mensajes`, "Segundo B", b.token);
      let orden = (await chats(org.token)).map((c) => c.compraId);
      assert.deepEqual(orden, [compraB.id, compraA.id]);

      await new Promise((resolver) => setTimeout(resolver, 5));
      await escribir(`/compras/${compraA.id}/mensajes`, "Tercero A", a.token);
      orden = (await chats(org.token)).map((c) => c.compraId);
      assert.deepEqual(orden, [compraA.id, compraB.id]);
    });

    test("un organizador solo ve los chats de sus eventos y un comprador solo los suyos", async () => {
      const { org, comprador, compra, url } = await escenario();
      await escribir(url, "Hola", comprador.token);

      const otroOrg = await api.registrar("ORGANIZADOR");
      const otroComprador = await api.registrar();
      assert.deepEqual(await chats(otroOrg.token), []);
      assert.deepEqual(await chats(otroComprador.token), []);
      assert.equal((await chats(org.token))[0].compraId, compra.id);
    });

    test("sin sesión da 401", async () => {
      assert.equal((await api.llamar("GET", "/compras/chats")).status, 401);
    });

    test("la foto del comprador se manda como ruta o URL, nunca como imagen entera", async () => {
      const { org, comprador, url } = await escenario();
      await api.llamar("PUT", "/auth/perfil", { foto: api.PNG }, comprador.token);
      await escribir(url, "Hola", comprador.token);

      const [chat] = await chats(org.token);
      assert.equal(chat.contraparte.foto, `/fotos/COMPRADOR/${comprador.usuario.id}`);
      assert.ok(!JSON.stringify(chat).includes("base64"));
    });
  });
});
