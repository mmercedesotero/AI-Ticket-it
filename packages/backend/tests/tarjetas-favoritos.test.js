const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Tarjetas y favoritos", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  const tarjetaValida = { numero: "4242424242424242", titular: "ANA PEREZ", vencimiento: "12/35", cvv: "123" };

  describe("Tarjetas", () => {
    test("guarda una tarjeta mostrando solo marca, últimos 4, vencimiento y titular", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("POST", "/tarjetas", tarjetaValida, token);

      assert.equal(r.status, 201);
      assert.equal(r.body.marca, "Visa");
      assert.equal(r.body.ultimos4, "4242");
      assert.equal(r.body.vencimiento, "12/35");
      assert.equal(r.body.titular, "ANA PEREZ");
      assert.equal(r.body.numero, undefined);
      assert.equal(r.body.cvv, undefined);
      assert.equal(r.body.huella, undefined);
      assert.ok(!JSON.stringify(r.body).includes("4242424242424242"));
    });

    test("reconoce la marca: empieza con 4 es Visa, con 5 es Mastercard, otra es genérica", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("POST", "/tarjetas", { ...tarjetaValida, numero: "5555555555554444" }, token)).body.marca, "Mastercard");
      assert.equal((await api.llamar("POST", "/tarjetas", { ...tarjetaValida, numero: "3782822463100051" }, token)).body.marca, "Tarjeta");
    });

    test("acepta el número escrito con espacios", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("POST", "/tarjetas", { ...tarjetaValida, numero: "4242 4242 4242 4242" }, token);
      assert.equal(r.status, 201);
      assert.equal(r.body.ultimos4, "4242");
    });

    test("la lista devuelve las tarjetas sin datos secretos", async () => {
      const { token } = await api.registrar();
      await api.llamar("POST", "/tarjetas", tarjetaValida, token);
      const r = await api.llamar("GET", "/tarjetas", undefined, token);
      assert.equal(r.status, 200);
      assert.equal(r.body.length, 1);
      assert.equal(r.body[0].huella, undefined);
    });

    test("valida número, titular, vencimiento y código de seguridad", async () => {
      const { token } = await api.registrar();
      const casos = [
        [{ ...tarjetaValida, numero: "424242424242424" }, "15 dígitos"],
        [{ ...tarjetaValida, numero: "4242424242424242A" }, "con letras"],
        [{ ...tarjetaValida, numero: undefined }, "sin número"],
        [{ ...tarjetaValida, titular: "  " }, "titular vacío"],
        [{ ...tarjetaValida, vencimiento: "13/30" }, "mes inválido"],
        [{ ...tarjetaValida, vencimiento: "1230" }, "formato sin barra"],
        [{ ...tarjetaValida, vencimiento: "01/20" }, "tarjeta vencida"],
        [{ ...tarjetaValida, cvv: "12" }, "cvv de 2 dígitos"],
        [{ ...tarjetaValida, cvv: "12345" }, "cvv de 5 dígitos"],
        [{ ...tarjetaValida, cvv: "abc" }, "cvv con letras"],
      ];
      for (const [cuerpo, motivo] of casos) {
        const r = await api.llamar("POST", "/tarjetas", cuerpo, token);
        assert.equal(r.status, 400, `debería rechazar: ${motivo}`);
      }
      assert.equal((await api.llamar("GET", "/tarjetas", undefined, token)).body.length, 0);
    });

    test("una tarjeta que vence este mes todavía es válida", async () => {
      const { token } = await api.registrar();
      const hoy = new Date();
      const vencimiento = `${String(hoy.getMonth() + 1).padStart(2, "0")}/${String(hoy.getFullYear()).slice(2)}`;
      assert.equal((await api.llamar("POST", "/tarjetas", { ...tarjetaValida, vencimiento }, token)).status, 201);
    });

    test("no deja guardar dos veces la misma tarjeta, pero otra persona sí puede", async () => {
      const a = await api.registrar();
      const b = await api.registrar();
      assert.equal((await api.llamar("POST", "/tarjetas", tarjetaValida, a.token)).status, 201);

      const repetida = await api.llamar("POST", "/tarjetas", tarjetaValida, a.token);
      assert.equal(repetida.status, 400);
      assert.match(repetida.body.error, /ya está guardada/i);

      assert.equal((await api.llamar("POST", "/tarjetas", tarjetaValida, b.token)).status, 201);
    });

    test("el máximo es 5 tarjetas por persona", async () => {
      const { token } = await api.registrar();
      const numeros = ["4111111111111111", "4012888888881881", "4222222222222", "5555555555554444", "5105105105105100", "4929251897047956"];
      numeros[2] = "4532015112830366";

      for (let i = 0; i < 5; i += 1) {
        assert.equal((await api.llamar("POST", "/tarjetas", { ...tarjetaValida, numero: numeros[i] }, token)).status, 201);
      }
      const sexta = await api.llamar("POST", "/tarjetas", { ...tarjetaValida, numero: numeros[5] }, token);
      assert.equal(sexta.status, 400);
      assert.match(sexta.body.error, /hasta 5/i);
    });

    test("se elimina una tarjeta propia y deja de aparecer", async () => {
      const { token } = await api.registrar();
      const { body } = await api.llamar("POST", "/tarjetas", tarjetaValida, token);

      const r = await api.llamar("DELETE", `/tarjetas/${body.id}`, undefined, token);
      assert.ok([200, 204].includes(r.status));
      assert.equal((await api.llamar("GET", "/tarjetas", undefined, token)).body.length, 0);
    });

    test("después de eliminarla se puede volver a guardar", async () => {
      const { token } = await api.registrar();
      const { body } = await api.llamar("POST", "/tarjetas", tarjetaValida, token);
      await api.llamar("DELETE", `/tarjetas/${body.id}`, undefined, token);
      assert.equal((await api.llamar("POST", "/tarjetas", tarjetaValida, token)).status, 201);
    });

    test("no se puede eliminar una tarjeta inexistente ni la de otra persona (404)", async () => {
      const a = await api.registrar();
      const b = await api.registrar();
      const { body } = await api.llamar("POST", "/tarjetas", tarjetaValida, a.token);

      assert.equal((await api.llamar("DELETE", "/tarjetas/999", undefined, a.token)).status, 404);
      assert.equal((await api.llamar("DELETE", `/tarjetas/${body.id}`, undefined, b.token)).status, 404);
      assert.equal((await api.llamar("GET", "/tarjetas", undefined, a.token)).body.length, 1);
    });

    test("cada persona ve solo sus tarjetas", async () => {
      const a = await api.registrar();
      const b = await api.registrar();
      await api.llamar("POST", "/tarjetas", tarjetaValida, a.token);
      assert.equal((await api.llamar("GET", "/tarjetas", undefined, b.token)).body.length, 0);
    });

    test("sin sesión da 401 y un organizador no tiene tarjetas (403)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      assert.equal((await api.llamar("GET", "/tarjetas")).status, 401);
      assert.equal((await api.llamar("GET", "/tarjetas", undefined, org.token)).status, 403);
      assert.equal((await api.llamar("POST", "/tarjetas", tarjetaValida, org.token)).status, 403);
    });
  });

  describe("Favoritos", () => {
    test("agrega un evento a favoritos y lo lista", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("POST", "/favoritos/1", undefined, token);
      assert.equal(r.status, 201);
      assert.deepEqual(r.body.map((e) => e.id), [1]);

      const lista = await api.llamar("GET", "/favoritos", undefined, token);
      assert.equal(lista.body[0].nombre, "Coldplay");
    });

    test("agregarlo dos veces no lo duplica", async () => {
      const { token } = await api.registrar();
      await api.llamar("POST", "/favoritos/1", undefined, token);
      const r = await api.llamar("POST", "/favoritos/1", undefined, token);
      assert.equal(r.body.length, 1);
    });

    test("agrega varios y quita uno", async () => {
      const { token } = await api.registrar();
      await api.llamar("POST", "/favoritos/1", undefined, token);
      await api.llamar("POST", "/favoritos/2", undefined, token);
      await api.llamar("POST", "/favoritos/3", undefined, token);

      const r = await api.llamar("DELETE", "/favoritos/2", undefined, token);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body.map((e) => e.id), [1, 3]);
    });

    test("quitar uno que no estaba no da error", async () => {
      const { token } = await api.registrar();
      const r = await api.llamar("DELETE", "/favoritos/1", undefined, token);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body, []);
    });

    test("un evento que no existe da 404", async () => {
      const { token } = await api.registrar();
      assert.equal((await api.llamar("POST", "/favoritos/999999", undefined, token)).status, 404);
    });

    test("cada persona tiene sus propios favoritos", async () => {
      const a = await api.registrar();
      const b = await api.registrar();
      await api.llamar("POST", "/favoritos/1", undefined, a.token);
      assert.equal((await api.llamar("GET", "/favoritos", undefined, b.token)).body.length, 0);
    });

    test("sin sesión da 401 y un organizador no tiene favoritos (403)", async () => {
      const org = await api.registrar("ORGANIZADOR");
      assert.equal((await api.llamar("GET", "/favoritos")).status, 401);
      assert.equal((await api.llamar("GET", "/favoritos", undefined, org.token)).status, 403);
      assert.equal((await api.llamar("POST", "/favoritos/1", undefined, org.token)).status, 403);
    });
  });
});
