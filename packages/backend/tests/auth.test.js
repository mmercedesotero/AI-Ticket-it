const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar, PNG } = require("./helpers");

describe("Registro, login y perfil", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  describe("Registro", () => {
    test("crea un comprador y devuelve token, rol y perfil sin datos secretos", async () => {
      const email = `nuevo-${api.unico()}@test.com`;
      const r = await api.llamar("POST", "/auth/registro", { rol: "COMPRADOR", nombre: "Lola", apellido: "Gómez", email, password: "secreto1" });

      assert.equal(r.status, 201);
      assert.equal(r.body.rol, "COMPRADOR");
      assert.ok(r.body.token);
      assert.equal(r.body.usuario.nombre, "Lola");
      assert.equal(r.body.usuario.email, email);
      assert.equal(r.body.usuario.passwordHash, undefined);
      assert.equal(r.body.usuario.tarjetas, undefined);
    });

    test("el rol por defecto es COMPRADOR", async () => {
      const r = await api.llamar("POST", "/auth/registro", { nombre: "Sin", apellido: "Rol", email: `sinrol-${api.unico()}@test.com`, password: "secreto1" });
      assert.equal(r.status, 201);
      assert.equal(r.body.rol, "COMPRADOR");
    });

    test("crea un organizador con el nombre de la productora", async () => {
      const r = await api.llamar("POST", "/auth/registro", { rol: "ORGANIZADOR", nombre: "Mi Productora", email: `org-${api.unico()}@test.com`, password: "secreto1" });
      assert.equal(r.status, 201);
      assert.equal(r.body.rol, "ORGANIZADOR");
      assert.equal(r.body.usuario.nombre, "Mi Productora");
      assert.equal(r.body.usuario.passwordHash, undefined);
    });

    test("guarda la foto si se manda una imagen válida", async () => {
      const r = await api.llamar("POST", "/auth/registro", { nombre: "Con", apellido: "Foto", email: `foto-${api.unico()}@test.com`, password: "secreto1", foto: PNG });
      assert.equal(r.status, 201);
      assert.equal(r.body.usuario.foto, PNG);
    });

    test("rechaza datos inválidos con 400", async () => {
      const base = { nombre: "Ana", apellido: "Test", email: `v-${api.unico()}@test.com`, password: "secreto1" };
      const casos = [
        [{ ...base, rol: "ADMIN" }, "rol inválido"],
        [{ ...base, nombre: "  " }, "nombre vacío"],
        [{ ...base, apellido: "" }, "comprador sin apellido"],
        [{ ...base, email: "no-es-un-email" }, "email inválido"],
        [{ ...base, password: "123" }, "contraseña corta"],
        [{ ...base, foto: "hola" }, "foto que no es imagen"],
      ];
      for (const [cuerpo, motivo] of casos) {
        const r = await api.llamar("POST", "/auth/registro", cuerpo);
        assert.equal(r.status, 400, `debería rechazar: ${motivo}`);
        assert.ok(r.body.error);
      }
    });

    test("no deja repetir un email, aunque cambien las mayúsculas, ni entre roles", async () => {
      const email = `dup-${api.unico()}@test.com`;
      await api.llamar("POST", "/auth/registro", { nombre: "A", apellido: "B", email, password: "secreto1" });

      let r = await api.llamar("POST", "/auth/registro", { nombre: "A", apellido: "B", email: email.toUpperCase(), password: "secreto1" });
      assert.equal(r.status, 400);
      assert.match(r.body.error, /ya existe/i);

      r = await api.llamar("POST", "/auth/registro", { rol: "ORGANIZADOR", nombre: "Org", email, password: "secreto1" });
      assert.equal(r.status, 400);
    });
  });

  describe("Login", () => {
    test("entra con las credenciales correctas (cuenta de prueba)", async () => {
      const r = await api.llamar("POST", "/auth/login", { email: "ana@mail.com", password: "123456" });
      assert.equal(r.status, 200);
      assert.equal(r.body.rol, "COMPRADOR");
      assert.ok(r.body.token);
      assert.equal(r.body.usuario.nombre, "Ana");
    });

    test("un organizador de prueba entra como ORGANIZADOR", async () => {
      const r = await api.llamar("POST", "/auth/login", { email: "live@mail.com", password: "123456" });
      assert.equal(r.status, 200);
      assert.equal(r.body.rol, "ORGANIZADOR");
    });

    test("el email no distingue mayúsculas ni espacios", async () => {
      const r = await api.llamar("POST", "/auth/login", { email: "  ANA@Mail.com ", password: "123456" });
      assert.equal(r.status, 200);
    });

    test("contraseña incorrecta y email inexistente dan el mismo 401 (no revela cuál falló)", async () => {
      const mala = await api.llamar("POST", "/auth/login", { email: "ana@mail.com", password: "incorrecta" });
      const inexistente = await api.llamar("POST", "/auth/login", { email: "nadie@mail.com", password: "123456" });
      assert.equal(mala.status, 401);
      assert.equal(inexistente.status, 401);
      assert.equal(mala.body.error, inexistente.body.error);
    });

    test("faltan datos: 400", async () => {
      assert.equal((await api.llamar("POST", "/auth/login", {})).status, 400);
      assert.equal((await api.llamar("POST", "/auth/login", { email: "ana@mail.com" })).status, 400);
    });

    test("un cuerpo que no es JSON válido devuelve 400 y no rompe el servidor", async () => {
      const r = await fetch(`${api.base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{esto no es json" });
      assert.equal(r.status, 400);
      assert.match((await r.json()).error, /JSON/);
    });
  });

  describe("Sesión (token)", () => {
    test("sin token: 401", async () => {
      assert.equal((await api.llamar("GET", "/auth/perfil")).status, 401);
    });

    test("token falso: 401", async () => {
      const r = await api.llamar("GET", "/auth/perfil", undefined, "esto.no.es.un.token");
      assert.equal(r.status, 401);
    });

    test("con token válido devuelve el rol y el perfil completo", async () => {
      const token = await api.login("ana@mail.com");
      const r = await api.llamar("GET", "/auth/perfil", undefined, token);
      assert.equal(r.status, 200);
      assert.equal(r.body.rol, "COMPRADOR");
      assert.equal(r.body.usuario.email, "ana@mail.com");
      assert.equal(r.body.usuario.pagoRapido, true);
    });
  });

  describe("Editar perfil", () => {
    test("cambia nombre, apellido, teléfono y ciudad", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("PUT", "/auth/perfil", { nombre: "Nuevo", apellido: "Apellido", telefono: "+54 1155551234", ciudad: "Rosario" }, token);
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.nombre, "Nuevo");
      assert.equal(r.body.usuario.apellido, "Apellido");
      assert.equal(r.body.usuario.telefono, "+54 1155551234");
      assert.equal(r.body.usuario.ciudad, "Rosario");

      const perfil = await api.llamar("GET", "/auth/perfil", undefined, token);
      assert.equal(perfil.body.usuario.ciudad, "Rosario");
    });

    test("solo cambia los campos que se mandan", async () => {
      const { token } = await api.registrar();
      await api.llamar("PUT", "/auth/perfil", { ciudad: "Salta" }, token);
      const r = await api.llamar("PUT", "/auth/perfil", { telefono: "+54 1144443333" }, token);
      assert.equal(r.body.usuario.ciudad, "Salta");
      assert.equal(r.body.usuario.nombre, "Test");
    });

    test("valida nombre, teléfono y ciudad", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("PUT", "/auth/perfil", { nombre: "   " }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { apellido: "" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { telefono: "abc" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { telefono: "1155551234" }, token)).status, 400, "sin código de país");
      assert.equal((await api.llamar("PUT", "/auth/perfil", { ciudad: "x".repeat(81) }, token)).status, 400);
    });

    test("se puede vaciar el teléfono", async () => {
      const { token } = await api.registrar();
      await api.llamar("PUT", "/auth/perfil", { telefono: "+54 1155551234" }, token);
      const r = await api.llamar("PUT", "/auth/perfil", { telefono: "" }, token);
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.telefono, "");
    });

    test("foto: se guarda, se rechaza si no es imagen y se puede quitar", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("PUT", "/auth/perfil", { foto: PNG }, token)).body.usuario.foto, PNG);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { foto: "hola" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { foto: "data:text/html;base64,AAAA" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { foto: "data:image/png;base64," + "A".repeat(2600000) }, token)).status, 400, "demasiado pesada");
      assert.equal((await api.llamar("PUT", "/auth/perfil", { foto: null }, token)).body.usuario.foto, null);
    });

    test("pagoRapido: solo para compradores y solo verdadero o falso", async () => {
      const comprador = await api.registrar();
      assert.equal((await api.llamar("PUT", "/auth/perfil", { pagoRapido: false }, comprador.token)).body.usuario.pagoRapido, false);
      assert.equal((await api.llamar("PUT", "/auth/perfil", { pagoRapido: "si" }, comprador.token)).status, 400);

      const organizador = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("PUT", "/auth/perfil", { pagoRapido: false, apellido: "ignorado" }, organizador.token);
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.pagoRapido, undefined);
      assert.equal(r.body.usuario.apellido, undefined);
    });

    test("el organizador edita nombre, teléfono, ciudad y logo", async () => {
      const { token } = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("PUT", "/auth/perfil", { nombre: "Otro Nombre", telefono: "+54 1144445555", ciudad: "CABA", foto: PNG }, token);
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.nombre, "Otro Nombre");
      assert.equal(r.body.usuario.foto, PNG);
    });

    test("sin sesión no se puede editar", async () => {
      assert.equal((await api.llamar("PUT", "/auth/perfil", { nombre: "x" })).status, 401);
    });
  });

  describe("Cambiar contraseña", () => {
    test("con la actual correcta, la nueva sirve para entrar y la vieja no", async () => {
      const { token, email } = await api.registrar();
      const r = await api.llamar("PUT", "/auth/password", { actual: "secreto1", nueva: "otraClave9" }, token);
      assert.equal(r.status, 200);

      assert.equal((await api.llamar("POST", "/auth/login", { email, password: "otraClave9" })).status, 200);
      assert.equal((await api.llamar("POST", "/auth/login", { email, password: "secreto1" })).status, 401);
    });

    test("rechaza la actual incorrecta, la nueva corta y la nueva igual a la actual", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("PUT", "/auth/password", { actual: "mal", nueva: "otraClave9" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/password", { actual: "secreto1", nueva: "123" }, token)).status, 400);
      assert.equal((await api.llamar("PUT", "/auth/password", { actual: "secreto1", nueva: "secreto1" }, token)).status, 400);
    });
  });

  describe("Recuperar contraseña", () => {
    test("un email que no existe recibe la misma respuesta, sin código", async () => {
      const r = await api.llamar("POST", "/auth/recuperar", { email: "nadie-existe@test.com" });
      assert.equal(r.status, 200);
      assert.ok(r.body.mensaje);
      assert.equal(r.body.codigoSimulado, undefined);
    });

    test("un email inválido da 400", async () => {
      assert.equal((await api.llamar("POST", "/auth/recuperar", { email: "no-es-email" })).status, 400);
    });

    test("con el código se elige una contraseña nueva, y el código no se puede reutilizar", async () => {
      const { email } = await api.registrar();
      const pedido = await api.llamar("POST", "/auth/recuperar", { email });
      const codigo = pedido.body.codigoSimulado;
      assert.match(codigo, /^\d{6}$/);

      const r = await api.llamar("POST", "/auth/restablecer", { email, codigo, password: "nuevaClave1" });
      assert.equal(r.status, 200);
      assert.equal((await api.llamar("POST", "/auth/login", { email, password: "nuevaClave1" })).status, 200);

      const otraVez = await api.llamar("POST", "/auth/restablecer", { email, codigo, password: "otraMas123" });
      assert.equal(otraVez.status, 400);
    });

    test("un código incorrecto o una contraseña corta se rechazan", async () => {
      const { email } = await api.registrar();
      const { body } = await api.llamar("POST", "/auth/recuperar", { email });

      assert.equal((await api.llamar("POST", "/auth/restablecer", { email, codigo: "000000", password: "nuevaClave1" })).status, 400);
      assert.equal((await api.llamar("POST", "/auth/restablecer", { email, codigo: body.codigoSimulado, password: "123" })).status, 400);
    });

    test("funciona también para organizadores", async () => {
      const { email } = await api.registrar("ORGANIZADOR");
      const { body } = await api.llamar("POST", "/auth/recuperar", { email });
      const r = await api.llamar("POST", "/auth/restablecer", { email, codigo: body.codigoSimulado, password: "nuevaClave1" });
      assert.equal(r.status, 200);
      assert.equal((await api.llamar("POST", "/auth/login", { email, password: "nuevaClave1" })).body.rol, "ORGANIZADOR");
    });
  });

  describe("Eliminar cuenta", () => {
    test("pide la contraseña correcta", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("DELETE", "/auth/cuenta", { password: "mal" }, token)).status, 400);
      assert.equal((await api.llamar("DELETE", "/auth/cuenta", {}, token)).status, 400);
    });

    test("un comprador sin compras activas la elimina y su token deja de servir", async () => {
      const { token, email } = await api.registrar();
      const r = await api.llamar("DELETE", "/auth/cuenta", { password: "secreto1" }, token);
      assert.equal(r.status, 200);

      assert.equal((await api.llamar("GET", "/auth/perfil", undefined, token)).status, 401);
      assert.equal((await api.llamar("POST", "/auth/login", { email, password: "secreto1" })).status, 401);
    });

    test("un comprador con entradas activas no puede eliminarla (403)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);

      const r = await api.llamar("DELETE", "/auth/cuenta", { password: "secreto1" }, comprador.token);
      assert.equal(r.status, 403);
      assert.match(r.body.error, /entradas activas/i);
    });

    test("un organizador con eventos no puede eliminarla; sin eventos sí", async () => {
      const conEventos = await api.registrar("ORGANIZADOR");
      await api.crearEvento(conEventos.token);
      assert.equal((await api.llamar("DELETE", "/auth/cuenta", { password: "secreto1" }, conEventos.token)).status, 403);

      const sinEventos = await api.registrar("ORGANIZADOR");
      assert.equal((await api.llamar("DELETE", "/auth/cuenta", { password: "secreto1" }, sinEventos.token)).status, 200);
    });
  });

  describe("Fotos de perfil", () => {
    test("GET /fotos/:rol/:id devuelve la imagen guardada", async () => {
      const { token, usuario } = await api.registrar();
      await api.llamar("PUT", "/auth/perfil", { foto: PNG }, token);

      const r = await api.llamar("GET", `/fotos/COMPRADOR/${usuario.id}`);
      assert.equal(r.status, 200);
      assert.equal(r.headers.get("content-type"), "image/png");
      assert.equal(r.body[1], 0x50); // "P" de PNG
    });

    test("sin foto: 404", async () => {
      const { usuario } = await api.registrar();
      assert.equal((await api.llamar("GET", `/fotos/COMPRADOR/${usuario.id}`)).status, 404);
    });
  });
});
