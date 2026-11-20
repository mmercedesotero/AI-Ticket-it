// Piezas compartidas por los tests: levantan el servidor real en un puerto libre, con los datos de prueba,
// y dan funciones para hablar con la API como lo haría la app.
//
// Cada archivo de test corre en su propio proceso, así que cada uno arranca con los datos de prueba limpios.
// Dentro de un archivo, cada test crea sus propios usuarios y eventos para no depender de los otros.

const app = require("../src/app");
const cargarSeeds = require("../src/seeds");
const container = require("../src/container");

// Fecha de hoy +/- N días en formato AAAA-MM-DD.
const fechaEn = (dias) => {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};

// PNG de 1x1 píxel, para probar imágenes.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let contador = 0;
const tarjetas = new Map(); // token -> id de su tarjeta
const unico = () => `${Date.now().toString(36)}${(contador += 1)}`;

// Levanta el servidor. Devuelve el "cliente" con todo lo necesario para escribir un test corto.
async function iniciar() {
  cargarSeeds();
  const servidor = await new Promise((resolver) => {
    const s = app.listen(0, () => resolver(s));
  });
  const base = `http://localhost:${servidor.address().port}`;

  const llamar = async (metodo, ruta, cuerpo, token) => {
    const respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const tipo = respuesta.headers.get("content-type") ?? "";
    const body = tipo.includes("json") ? await respuesta.json() : Buffer.from(await respuesta.arrayBuffer());
    return { status: respuesta.status, body, headers: respuesta.headers };
  };

  const cliente = { servidor, base, llamar, container, fechaEn, PNG, unico };

  // Entra con una cuenta existente y devuelve su token.
  cliente.login = async (email, password = "123456") => {
    const r = await llamar("POST", "/auth/login", { email, password });
    return r.body.token;
  };

  // Crea una cuenta nueva y devuelve { token, usuario, email }.
  cliente.registrar = async (rol = "COMPRADOR", extra = {}) => {
    const email = `${rol.toLowerCase()}-${unico()}@test.com`;
    const datos =
      rol === "ORGANIZADOR"
        ? { rol, nombre: `Productora ${unico()}`, email, password: "secreto1", ...extra }
        : { rol, nombre: "Test", apellido: "Usuario", email, password: "secreto1", ...extra };
    const r = await llamar("POST", "/auth/registro", datos);
    return { token: r.body.token, usuario: r.body.usuario, email, password: datos.password };
  };

  // Un evento de prueba. Devuelve el evento creado (con sus tipos de entrada y ids).
  cliente.crearEvento = async (token, cambios = {}) => {
    const r = await llamar(
      "POST",
      "/eventos",
      {
        nombre: `Evento ${unico()}`,
        fecha: fechaEn(30),
        descripcion: "Evento de prueba",
        categoriaId: 1,
        tiposEntrada: [
          { nombre: "General", precio: 1000, ubicacion: "Campo", cupoDisponible: 50 },
          { nombre: "VIP", precio: 5000, ubicacion: "Palco", cupoDisponible: 5 },
        ],
        ...cambios,
      },
      token
    );
    return r.body;
  };

  // Guarda una tarjeta válida (o la que se indique) y devuelve su id.
  cliente.guardarTarjeta = async (token, numero = "4242424242424242") => {
    const r = await llamar("POST", "/tarjetas", { numero, titular: "TEST USUARIO", vencimiento: "12/35", cvv: "123" }, token);
    return r.body.id;
  };

  // Compra (queda pendiente de pago).
  cliente.comprar = async (token, evento, entradaIndice = 0, cantidad = 1) =>
    (await llamar("POST", "/compras", { eventoId: evento.id, entradaId: evento.tiposEntrada[entradaIndice].id, cantidad }, token)).body;

  // Compra y paga: devuelve la compra ya confirmada.
  cliente.comprarYPagar = async (token, evento, entradaIndice = 0, cantidad = 1) => {
    const compra = await cliente.comprar(token, evento, entradaIndice, cantidad);
    // Cada persona guarda una sola tarjeta (el máximo es 5) y la reutiliza en todas sus compras.
    if (!tarjetas.has(token)) tarjetas.set(token, await cliente.guardarTarjeta(token, `41111111${10000000 + (contador += 1)}`));
    const tarjetaId = tarjetas.get(token);
    return (await llamar("PUT", `/compras/${compra.id}/pagar`, { tarjetaId }, token)).body;
  };

  // Hace pasar el evento: usado para probar reseñas y cancelaciones de eventos ya realizados.
  cliente.hacerPasarEvento = (eventoId) => {
    container.eventoRepository.findById(eventoId).fecha = fechaEn(-3);
  };

  cliente.cerrar = async () => {
    servidor.closeAllConnections?.();
    await new Promise((resolver) => servidor.close(resolver));
  };

  return cliente;
}

module.exports = { iniciar, fechaEn, PNG };
