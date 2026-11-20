// Tests de las piezas chicas, sin levantar el servidor: modelos y utilidades.
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const Compra = require("../src/models/Compra");
const Evento = require("../src/models/Evento");
const Entrada = require("../src/models/Entrada");
const EstadoCompra = require("../src/models/EstadoCompra");
const Usuario = require("../src/models/Usuario");
const Organizador = require("../src/models/Organizador");
const { hashPassword, verificarPassword } = require("../src/utils/password");
const { firmarToken, verificarToken } = require("../src/utils/token");
const { validarImagen, decodificarImagen } = require("../src/utils/imagen");
const { fotoPublica } = require("../src/utils/foto");
const pick = require("../src/utils/pick");
const { HORAS_RESERVA, HORAS_AVISO, creadaEn } = require("../src/utils/reservas");
const { fechaEn, PNG } = require("./helpers");

describe("Contraseñas", () => {
  test("no se guarda la contraseña en claro y cada hash es distinto (usa sal)", () => {
    const a = hashPassword("secreto1");
    const b = hashPassword("secreto1");
    assert.notEqual(a, "secreto1");
    assert.ok(!a.includes("secreto1"));
    assert.notEqual(a, b);
  });

  test("verifica la contraseña correcta y rechaza las demás", () => {
    const hash = hashPassword("secreto1");
    assert.equal(verificarPassword("secreto1", hash), true);
    assert.equal(verificarPassword("Secreto1", hash), false);
    assert.equal(verificarPassword("", hash), false);
  });

  test("un hash dañado no verifica ni rompe", () => {
    assert.equal(verificarPassword("secreto1", "basura"), false);
    assert.equal(verificarPassword("secreto1", undefined), false);
  });
});

describe("Token", () => {
  test("lleva el id y el rol", () => {
    const datos = verificarToken(firmarToken(7, "ORGANIZADOR"));
    assert.equal(datos.id, 7);
    assert.equal(datos.rol, "ORGANIZADOR");
  });

  test("un token alterado o falso no se acepta", () => {
    const token = firmarToken(7, "COMPRADOR");
    assert.throws(() => verificarToken(`${token}x`));
    assert.throws(() => verificarToken("no.es.un.token"));
    assert.throws(() => verificarToken(""));
  });
});

describe("Imágenes", () => {
  test("acepta PNG, JPG y WEBP en formato data URI", () => {
    assert.equal(validarImagen(PNG), PNG);
    assert.ok(validarImagen("data:image/jpeg;base64,AAAA"));
    assert.ok(validarImagen("data:image/jpg;base64,AAAA"));
    assert.ok(validarImagen("data:image/webp;base64,AAAA"));
  });

  test("vacío, null o ausente significa 'sin imagen'", () => {
    assert.equal(validarImagen(undefined), null);
    assert.equal(validarImagen(null), null);
    assert.equal(validarImagen(""), null);
  });

  test("rechaza lo que no es imagen o es demasiado pesado", () => {
    assert.throws(() => validarImagen("hola"));
    assert.throws(() => validarImagen("data:text/html;base64,AAAA"));
    assert.throws(() => validarImagen("data:image/svg+xml;base64,AAAA"));
    assert.throws(() => validarImagen(123));
    assert.throws(() => validarImagen("data:image/png;base64," + "A".repeat(2600000)));
  });

  test("decodifica el tipo y los bytes", () => {
    const { tipo, datos } = decodificarImagen(PNG);
    assert.equal(tipo, "image/png");
    assert.equal(datos[1], 0x50);
  });

  test("la foto pública es la URL, una ruta del servidor o nada", () => {
    assert.equal(fotoPublica(null, "COMPRADOR"), null);
    assert.equal(fotoPublica({ id: 1, foto: null }, "COMPRADOR"), null);
    assert.equal(fotoPublica({ id: 1, foto: "https://sitio.com/a.jpg" }, "COMPRADOR"), "https://sitio.com/a.jpg");
    assert.equal(fotoPublica({ id: 4, foto: PNG }, "ORGANIZADOR"), "/fotos/ORGANIZADOR/4");
  });
});

describe("Reservas", () => {
  test("el aviso llega antes de que venza", () => {
    assert.ok(HORAS_AVISO < HORAS_RESERVA);
    assert.equal(HORAS_RESERVA, 24);
    assert.equal(HORAS_AVISO, 12);
  });

  test("la reserva se cuenta desde el primer estado del historial", () => {
    const compra = new Compra(1, {}, {}, {}, 1, 100);
    const creada = creadaEn(compra);
    assert.ok(Math.abs(creada - Date.now()) < 1000);
    compra.actualizarEstado(EstadoCompra.CONFIRMADA);
    assert.equal(creadaEn(compra), creada, "pagar no cambia cuándo se reservó");
  });
});

describe("pick", () => {
  test("se queda solo con los campos permitidos", () => {
    assert.deepEqual(pick({ a: 1, b: 2, c: 3 }, ["a", "c", "z"]), { a: 1, c: 3 });
  });

  test("ignora campos ausentes", () => {
    assert.deepEqual(pick({}, ["a"]), {});
  });
});

describe("Compra", () => {
  test("empieza pendiente de pago, con su primer registro en el historial", () => {
    const compra = new Compra(1, {}, {}, {}, 2, 200);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE_PAGO);
    assert.equal(compra.historial.length, 1);
    assert.equal(compra.historial[0].estado, EstadoCompra.PENDIENTE_PAGO);
    assert.deepEqual(compra.lecturas, { COMPRADOR: 0, ORGANIZADOR: 0 });
  });

  test("cada cambio de estado queda registrado", () => {
    const compra = new Compra(1, {}, {}, {}, 1, 100);
    compra.actualizarEstado(EstadoCompra.CONFIRMADA);
    compra.actualizarEstado(EstadoCompra.UTILIZADA);
    assert.equal(compra.estado, EstadoCompra.UTILIZADA);
    assert.deepEqual(compra.historial.map((h) => h.estado), ["PENDIENTE_PAGO", "CONFIRMADA", "UTILIZADA"]);
  });

  test("un estado que no existe lanza error y no cambia nada", () => {
    const compra = new Compra(1, {}, {}, {}, 1, 100);
    assert.throws(() => compra.actualizarEstado("INVENTADO"), RangeError);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE_PAGO);
    assert.equal(compra.historial.length, 1);
  });

  test("calcula los días que faltan para el evento", () => {
    const compra = (dias) => new Compra(1, {}, { fecha: fechaEn(dias) }, {}, 1, 100);
    assert.equal(compra(0).diasParaElEvento(), 0);
    assert.equal(compra(1).diasParaElEvento(), 1);
    assert.equal(compra(10).diasParaElEvento(), 10);
    assert.equal(compra(-2).diasParaElEvento(), -2);
  });
});

describe("Evento", () => {
  const evento = (fecha, entradas = []) => new Evento(1, "Show", fecha, "desc", null, entradas, [], null);

  test("sabe si ya se realizó: hoy todavía no, ayer sí", () => {
    assert.equal(evento(fechaEn(-1)).yaSeRealizo(), true);
    assert.equal(evento(fechaEn(0)).yaSeRealizo(), false);
    assert.equal(evento(fechaEn(1)).yaSeRealizo(), false);
  });

  test("el precio 'desde' es el de la entrada más barata", () => {
    const e = evento(fechaEn(5), [new Entrada(1, "VIP", 5000, "", 1), new Entrada(2, "General", 1000, "", 1)]);
    assert.equal(e.precioDesde(), 1000);
    assert.equal(evento(fechaEn(5)).precioDesde(), null);
  });

  test("tuPrecioEstaEntre mira si alguna entrada entra en el rango", () => {
    const e = evento(fechaEn(5), [new Entrada(1, "VIP", 5000, "", 1), new Entrada(2, "General", 1000, "", 1)]);
    assert.equal(e.tuPrecioEstaEntre(900, 1100), true);
    assert.equal(e.tuPrecioEstaEntre(4000, 6000), true);
    assert.equal(e.tuPrecioEstaEntre(1500, 4500), false);
  });

  test("al convertirse en JSON no incluye la imagen, solo su URL", () => {
    const e = evento(fechaEn(5));
    assert.equal(JSON.parse(JSON.stringify(e)).portada, null);
    e.portada = PNG;
    const json = JSON.parse(JSON.stringify(e));
    assert.equal(json.portada, "/eventos/1/portada");
    assert.ok(!JSON.stringify(json).includes("base64"));
  });
});

describe("Qué datos salen en las respuestas", () => {
  test("un comprador nunca muestra el hash, las tarjetas ni sus datos privados fuera de su perfil", () => {
    const u = new Usuario(1, "Ana", "Pérez", "ana@mail.com", "hash-secreto");
    u.tarjetas.push({ numero: "4242" });
    u.telefono = "+54 1155551234";
    u.foto = PNG;

    const publico = JSON.parse(JSON.stringify(u));
    for (const campo of ["passwordHash", "tarjetas", "telefono", "foto", "pagoRapido"]) {
      assert.equal(publico[campo], undefined, `no debería mostrar ${campo}`);
    }

    const perfil = u.toPerfil();
    assert.equal(perfil.passwordHash, undefined);
    assert.equal(perfil.tarjetas, undefined);
    assert.equal(perfil.telefono, "+54 1155551234");
    assert.equal(perfil.foto, PNG);
    assert.equal(perfil.pagoRapido, true);
  });

  test("un organizador solo muestra su id y nombre, salvo en su propio perfil", () => {
    const o = new Organizador(3, "Productora", "org@mail.com", "hash-secreto");
    o.eventos.push({ circular: true });
    o.foto = PNG;

    assert.deepEqual(JSON.parse(JSON.stringify(o)), { id: 3, nombre: "Productora" });
    const perfil = o.toPerfil();
    assert.equal(perfil.email, "org@mail.com");
    assert.equal(perfil.passwordHash, undefined);
    assert.equal(perfil.eventos, undefined);
  });
});
