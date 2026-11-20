const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Categorías (tipos de evento)", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  test("las categorías de prueba incluyen Deportes", async () => {
    const r = await api.llamar("GET", "/categorias");
    assert.equal(r.status, 200);
    assert.ok(r.body.some((c) => c.nombre === "Deportes"));
  });

  test("hay eventos deportivos de prueba, con entradas y organizador", async () => {
    const categorias = (await api.llamar("GET", "/categorias")).body;
    const deportes = categorias.find((c) => c.nombre === "Deportes");
    const r = await api.llamar("GET", `/eventos?categoriaId=${deportes.id}`);

    assert.ok(r.body.length >= 5);
    assert.ok(r.body.every((e) => e.tiposEntrada.length > 0 && e.organizador.nombre));
    assert.ok(r.body.some((e) => e.nombre === "Maratón de la Ciudad 21K"));
  });

  test("un organizador agrega una categoría nueva y queda disponible para todos", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const nombre = `Conferencias ${api.unico()}`;
    const r = await api.llamar("POST", "/categorias", { nombre, descripcion: "Charlas y congresos" }, org.token);

    assert.equal(r.status, 201);
    assert.equal(r.body.nombre, nombre);
    assert.equal(r.body.descripcion, "Charlas y congresos");
    assert.ok(r.body.id);

    const lista = (await api.llamar("GET", "/categorias")).body;
    assert.ok(lista.some((c) => c.id === r.body.id));
  });

  test("se puede crear un evento con la categoría nueva y filtrar por ella", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const categoria = (await api.llamar("POST", "/categorias", { nombre: `Gastronomía ${api.unico()}` }, org.token)).body;
    const evento = await api.crearEvento(org.token, { categoriaId: categoria.id });

    assert.equal(evento.categoria.id, categoria.id);
    const filtrados = (await api.llamar("GET", `/eventos?categoriaId=${categoria.id}`)).body;
    assert.deepEqual(filtrados.map((e) => e.id), [evento.id]);
  });

  test("el nombre se recorta y los espacios de más se juntan", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const r = await api.llamar("POST", "/categorias", { nombre: `   Feria    del   Libro ${api.unico()}  ` }, org.token);
    assert.equal(r.status, 201);
    assert.ok(!r.body.nombre.includes("  "));
    assert.equal(r.body.nombre, r.body.nombre.trim());
  });

  test("la descripción es opcional", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const r = await api.llamar("POST", "/categorias", { nombre: `Sin descripción ${api.unico()}` }, org.token);
    assert.equal(r.status, 201);
    assert.equal(r.body.descripcion, "");
  });

  test("no deja repetir una categoría, sin importar mayúsculas, tildes ni espacios", async () => {
    const org = await api.registrar("ORGANIZADOR");
    for (const nombre of ["Deportes", "DEPORTES", "  deportes  ", "Déportes"]) {
      const r = await api.llamar("POST", "/categorias", { nombre }, org.token);
      assert.equal(r.status, 400, `debería rechazar "${nombre}"`);
      assert.match(r.body.error, /ya existe/i);
    }
    // "Teatro" también es una de las de prueba
    assert.equal((await api.llamar("POST", "/categorias", { nombre: "teatro" }, org.token)).status, 400);
  });

  test("dos categorías nuevas iguales: la segunda se rechaza", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const nombre = `Única ${api.unico()}`;
    assert.equal((await api.llamar("POST", "/categorias", { nombre }, org.token)).status, 201);
    assert.equal((await api.llamar("POST", "/categorias", { nombre: nombre.toUpperCase() }, org.token)).status, 400);
  });

  test("valida el nombre: obligatorio, entre 2 y 30 caracteres y de tipo texto", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const invalidos = ["", "   ", "a", "x".repeat(31), undefined, 123, null];
    for (const nombre of invalidos) {
      const r = await api.llamar("POST", "/categorias", { nombre }, org.token);
      assert.equal(r.status, 400, `debería rechazar ${JSON.stringify(nombre)}`);
    }
    assert.equal((await api.llamar("POST", "/categorias", { nombre: "x".repeat(30) }, org.token)).status, 201);
    assert.equal((await api.llamar("POST", "/categorias", { nombre: "Ab" }, org.token)).status, 201);
  });

  test("la descripción tiene que ser un texto", async () => {
    const org = await api.registrar("ORGANIZADOR");
    const r = await api.llamar("POST", "/categorias", { nombre: `Con número ${api.unico()}`, descripcion: 123 }, org.token);
    assert.equal(r.status, 400);
  });

  test("un comprador no puede crear categorías (403) y sin sesión da 401", async () => {
    const comprador = await api.registrar();
    assert.equal((await api.llamar("POST", "/categorias", { nombre: "Nueva" }, comprador.token)).status, 403);
    assert.equal((await api.llamar("POST", "/categorias", { nombre: "Nueva" })).status, 401);
  });

  test("ver las categorías no requiere sesión", async () => {
    assert.equal((await api.llamar("GET", "/categorias")).status, 200);
  });
});
