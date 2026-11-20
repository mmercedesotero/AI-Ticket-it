const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { iniciar } = require("./helpers");

describe("Lugar del evento (dirección, ciudad y país)", () => {
  let api;
  before(async () => {
    api = await iniciar();
  });
  after(() => api.cerrar());

  const cuerpoBase = () => ({
    nombre: `Con lugar ${api.unico()}`,
    fecha: api.fechaEn(20),
    descripcion: "x",
    categoriaId: 1,
    tiposEntrada: [{ nombre: "General", precio: 100, ubicacion: "Campo", cupoDisponible: 10 }],
  });

  describe("Datos de prueba", () => {
    test("todos los eventos de prueba tienen su lugar completo", async () => {
      const lista = (await api.llamar("GET", "/eventos")).body;
      assert.ok(lista.length >= 30);
      for (const e of lista) {
        assert.ok(e.lugar, `${e.nombre} no tiene lugar`);
        assert.ok(e.lugar.nombre && e.lugar.ciudad && e.lugar.pais, `${e.nombre} tiene el lugar incompleto`);
      }
    });

    test("hay eventos en varias ciudades y en más de un país", async () => {
      const lista = (await api.llamar("GET", "/eventos")).body;
      const paises = new Set(lista.map((e) => e.lugar.pais));
      const ciudades = new Set(lista.map((e) => e.lugar.ciudad));
      assert.ok(paises.size >= 3);
      assert.ok(ciudades.size >= 6);
    });

    test("el detalle trae el lugar", async () => {
      const r = await api.llamar("GET", "/eventos/1");
      assert.deepEqual(r.body.lugar, {
        nombre: "Estadio River Plate",
        direccion: "Av. Pres. Figueroa Alcorta 7597",
        ciudad: "Buenos Aires",
        pais: "Argentina",
      });
    });
  });

  describe("Crear con lugar", () => {
    test("guarda el lugar tal como se manda", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar: { nombre: "Teatro Colón", direccion: "Cerrito 628", ciudad: "Buenos Aires", pais: "Argentina" } }, org.token);
      assert.equal(r.status, 201);
      assert.deepEqual(r.body.lugar, { nombre: "Teatro Colón", direccion: "Cerrito 628", ciudad: "Buenos Aires", pais: "Argentina" });
    });

    test("la dirección es opcional", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar: { nombre: "Plaza Central", ciudad: "Rosario", pais: "Argentina" } }, org.token);
      assert.equal(r.status, 201);
      assert.equal(r.body.lugar.direccion, "");
    });

    test("recorta los espacios de los textos", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar: { nombre: "  Club   del   Sur  ", direccion: "  Calle 1  ", ciudad: " Mendoza ", pais: " Argentina " } }, org.token);
      assert.deepEqual(r.body.lugar, { nombre: "Club del Sur", direccion: "Calle 1", ciudad: "Mendoza", pais: "Argentina" });
    });

    test("sin lugar no se puede crear el evento", async () => {
      const org = await api.registrar("ORGANIZADOR");
      for (const lugar of [undefined, null, "Buenos Aires", ["x"], {}]) {
        const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar }, org.token);
        assert.equal(r.status, 400, `debería rechazar lugar ${JSON.stringify(lugar)}`);
        assert.ok(r.body.error);
      }
    });

    test("el nombre del lugar, la ciudad y el país son obligatorios", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const completo = { nombre: "Sala", ciudad: "Salta", pais: "Argentina" };
      for (const faltante of ["nombre", "ciudad", "pais"]) {
        for (const valor of [undefined, "", "   ", null]) {
          const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar: { ...completo, [faltante]: valor } }, org.token);
          assert.equal(r.status, 400, `debería rechazar ${faltante}=${JSON.stringify(valor)}`);
        }
      }
    });

    test("valida el largo y el tipo de cada dato", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const completo = { nombre: "Sala", direccion: "Calle 1", ciudad: "Salta", pais: "Argentina" };
      const invalidos = [
        { nombre: "x" },
        { nombre: "x".repeat(81) },
        { direccion: "ab" },
        { direccion: "x".repeat(121) },
        { ciudad: "x" },
        { ciudad: "x".repeat(61) },
        { pais: "x" },
        { nombre: 123 },
        { ciudad: ["Salta"] },
      ];
      for (const cambio of invalidos) {
        const r = await api.llamar("POST", "/eventos", { ...cuerpoBase(), lugar: { ...completo, ...cambio } }, org.token);
        assert.equal(r.status, 400, `debería rechazar ${JSON.stringify(cambio)}`);
      }
    });
  });

  describe("Editar el lugar", () => {
    test("se puede cambiar solo una parte y el resto se conserva", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { ciudad: "Córdoba" } }, org.token);

      assert.equal(r.status, 200);
      assert.equal(r.body.lugar.ciudad, "Córdoba");
      assert.equal(r.body.lugar.nombre, evento.lugar.nombre);
      assert.equal(r.body.lugar.pais, evento.lugar.pais);
      assert.equal(r.body.lugar.direccion, evento.lugar.direccion);
    });

    test("se puede vaciar la dirección pero no el nombre, la ciudad ni el país", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);

      const sinDireccion = await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { direccion: "" } }, org.token);
      assert.equal(sinDireccion.status, 200);
      assert.equal(sinDireccion.body.lugar.direccion, "");

      for (const campo of ["nombre", "ciudad", "pais"]) {
        const r = await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { [campo]: "" } }, org.token);
        assert.equal(r.status, 400, `no debería dejar vaciar ${campo}`);
      }
    });

    test("un lugar inválido no cambia nada", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Cambio válido", lugar: { ciudad: "x" } }, org.token);
      assert.equal(r.status, 400);

      const actual = (await api.llamar("GET", `/eventos/${evento.id}`)).body;
      assert.equal(actual.nombre, evento.nombre);
      assert.deepEqual(actual.lugar, evento.lugar);
    });

    test("no hace falta mandar el lugar para editar otras cosas", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { nombre: "Otro nombre" }, org.token);
      assert.deepEqual(r.body.lugar, evento.lugar);
    });

    test("cambiar el lugar avisa a quienes ya compraron; dejarlo igual no avisa", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(org.token);
      const comprador = await api.registrar();
      await api.comprar(comprador.token, evento);

      await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { ...evento.lugar } }, org.token);
      const avisos = async () => (await api.llamar("GET", "/notificaciones", undefined, comprador.token)).body.notificaciones.filter((n) => n.tipo === "EVENTO_MODIFICADO");
      assert.equal((await avisos()).length, 0, "mismo lugar: sin aviso");

      await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { nombre: "Estadio Nuevo", ciudad: "Rosario" } }, org.token);
      const [aviso] = await avisos();
      assert.equal(aviso.titulo, "Cambió el lugar de tu evento");
      assert.ok(aviso.mensaje.includes("Estadio Nuevo"));
      assert.ok(aviso.mensaje.includes("Rosario"));
    });

    test("solo el organizador dueño puede cambiar el lugar", async () => {
      const dueno = await api.registrar("ORGANIZADOR");
      const otro = await api.registrar("ORGANIZADOR");
      const evento = await api.crearEvento(dueno.token);
      const r = await api.llamar("PUT", `/eventos/${evento.id}`, { lugar: { ciudad: "Salta" } }, otro.token);
      assert.equal(r.status, 403);
    });
  });

  describe("Buscar y filtrar por lugar", () => {
    test("el texto busca también en el lugar, la dirección, la ciudad y el país", async () => {
      const nombres = async (texto) => (await api.llamar("GET", `/eventos?texto=${encodeURIComponent(texto)}`)).body.map((e) => e.nombre);

      assert.ok((await nombres("river plate")).includes("Coldplay"), "por nombre del lugar");
      assert.ok((await nombres("figueroa alcorta")).includes("Coldplay"), "por dirección");
      assert.ok((await nombres("montevideo")).includes("Festival de Jazz"), "por ciudad");
      assert.ok((await nombres("chile")).includes("Cine Bajo las Estrellas"), "por país");
    });

    test("filtra por ciudad sin importar mayúsculas ni tildes", async () => {
      for (const ciudad of ["Córdoba", "cordoba", "CÓRDOBA"]) {
        const r = await api.llamar("GET", `/eventos?ciudad=${encodeURIComponent(ciudad)}`);
        assert.ok(r.body.length >= 4, `con ${ciudad}`);
        assert.ok(r.body.every((e) => e.lugar.ciudad === "Córdoba"));
      }
    });

    test("filtra por país", async () => {
      const r = await api.llamar("GET", "/eventos?pais=Uruguay");
      assert.deepEqual(r.body.map((e) => e.nombre), ["Festival de Jazz"]);
    });

    test("la ciudad se compara completa: 'Buenos' no es 'Buenos Aires'", async () => {
      assert.deepEqual((await api.llamar("GET", "/eventos?ciudad=Buenos")).body, []);
    });

    test("se puede combinar con la categoría y el texto", async () => {
      const categorias = (await api.llamar("GET", "/categorias")).body;
      const deportes = categorias.find((c) => c.nombre === "Deportes");
      const r = await api.llamar("GET", `/eventos?categoriaId=${deportes.id}&ciudad=Buenos Aires`);
      assert.ok(r.body.length >= 3);
      assert.ok(r.body.every((e) => e.categoria.id === deportes.id && e.lugar.ciudad === "Buenos Aires"));
    });

    test("una ciudad sin eventos devuelve lista vacía", async () => {
      const r = await api.llamar("GET", "/eventos?ciudad=Atlantis");
      assert.equal(r.status, 200);
      assert.deepEqual(r.body, []);
    });

    test("un evento nuevo se encuentra por su ciudad", async () => {
      const org = await api.registrar("ORGANIZADOR");
      const ciudad = `Ciudad${api.unico()}`;
      const evento = await api.crearEvento(org.token, { lugar: { nombre: "Sala Nueva", ciudad, pais: "Argentina" } });
      const r = await api.llamar("GET", `/eventos?ciudad=${ciudad}`);
      assert.deepEqual(r.body.map((e) => e.id), [evento.id]);
    });
  });
});
