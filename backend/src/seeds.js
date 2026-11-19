const Usuario = require("./models/Usuario");
const Organizador = require("./models/Organizador");
const Categoria = require("./models/Categoria");
const Evento = require("./models/Evento");
const Entrada = require("./models/Entrada");
const EstadoCompra = require("./models/EstadoCompra");
const CompraService = require("./services/CompraService");
const { usuarioRepository, eventoRepository, organizadorRepository, compraRepository, categoriaRepository, reseniaRepository } = require("./container");
const ReseniaService = require("./services/ReseniaService");
const { hashPassword } = require("./utils/password");

// Fecha de mañana en formato AAAA-MM-DD (para probar el recordatorio "tu evento es mañana").
const manana = new Date();
manana.setDate(manana.getDate() + 1);
const fechaManana = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, "0")}-${String(manana.getDate()).padStart(2, "0")}`;

function cargarDatos() {
  // Todas las cuentas de prueba (compradores y organizadores) tienen la contraseña "123456".
  const crearUsuario = (nombre, apellido, email) =>
    usuarioRepository.save(new Usuario(undefined, nombre, apellido, email, hashPassword("123456")));
  const ana = crearUsuario("Ana", "Perez", "ana@mail.com");
  const mer = crearUsuario("Mer", "Perez", "mer@mail.com");
  const tomas = crearUsuario("Tomas", "Gomez", "tomas@mail.com");
  const recital = categoriaRepository.save(new Categoria(undefined, "Recital", "Musica en vivo"));
  const teatro = categoriaRepository.save(new Categoria(undefined, "Teatro", "Obras y espectaculos"));
  const festival = categoriaRepository.save(new Categoria(undefined, "Festival", "Festivales de varios dias"));

  const liveNation = organizadorRepository.save(new Organizador(undefined, "Live Nation", "live@mail.com", hashPassword("123456")));
  const teatroBA = organizadorRepository.save(new Organizador(undefined, "Teatro BA", "teatro@mail.com", hashPassword("123456")));

  const eventosIniciales = [
    { nombre: "Coldplay", fecha: "2027-01-10", descripcion: "Gira mundial", categoria: recital, organizador: liveNation,
      entradas: [["General", 80000, "Campo", 100], ["VIP", 200000, "Palco", 20]] },
    { nombre: "Festival de Jazz", fecha: "2027-03-20", descripcion: "Dos dias de jazz en vivo", categoria: festival, organizador: liveNation,
      entradas: [["General", 15000, "Campo", 200], ["VIP", 45000, "Palco", 30]] },
    { nombre: "Hamlet", fecha: "2026-12-05", descripcion: "Clasico de Shakespeare", categoria: teatro, organizador: teatroBA,
      entradas: [["Platea", 35000, "Sala", 80], ["Pullman", 25000, "Balcon", 60]] },
    { nombre: "Lollapalooza", fecha: "2027-03-26", descripcion: "Tres dias de musica", categoria: festival, organizador: liveNation,
      entradas: [["Dia 1", 120000, "Campo", 500], ["Pase 3 dias", 300000, "Campo", 100]] },
    { nombre: "Noche de Rock", fecha: "2027-06-01", descripcion: "Show ya realizado", categoria: recital, organizador: teatroBA,
      entradas: [["General", 20000, "Campo", 150]] },
    { nombre: "Cosquin Rock 2025", fecha: "2027-02-15", descripcion: "Festival ya realizado", categoria: festival, organizador: liveNation,
      entradas: [["General", 50000, "Campo", 300]] },
    { nombre: "Stand-Up Comedy", fecha: fechaManana, descripcion: "Una noche de humor con los mejores comediantes", categoria: teatro, organizador: teatroBA,
      entradas: [["General", 12000, "Platea", 80], ["VIP", 25000, "Primera fila", 20]] },
  ];

  const eventos = eventosIniciales.map((datos) => {
    const tiposEntrada = datos.entradas.map(
      ([nombre, precio, ubicacion, cupo], i) =>
        new Entrada(i + 1, nombre, precio, ubicacion, cupo)
    );
    const evento = eventoRepository.save(
      new Evento(undefined, datos.nombre, datos.fecha, datos.descripcion,
        datos.categoria, tiposEntrada, [], datos.organizador)
    );
    datos.organizador.eventos.push(evento);
    return evento;
  });
  const [coldplay, jazz, hamlet, lolla, nocheRock, cosquin, standUp] = eventos;

  // Favoritos de ejemplo para Ana.
  ana.favoritos.push(coldplay.id, jazz.id, lolla.id);

  const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository);
  const comprar = (usuario, evento, entradaId, cantidad, estado) => {
    const compra = compraService.comprarEntrada({
      usuarioId: usuario.id, eventoId: evento.id, entradaId, cantidad,
    });
    // Una entrada utilizada primero estuvo confirmada.
    if (estado === EstadoCompra.UTILIZADA) compra.actualizarEstado(EstadoCompra.CONFIRMADA);
    if (estado) compra.actualizarEstado(estado);

    // Fechas del historial: las compras ya utilizadas son más viejas que las demás.
    const base = estado === EstadoCompra.UTILIZADA ? 12 : 3;
    compra.historial.forEach((cambio, i) => {
      cambio.fechaHora = new Date(Date.now() - Math.max(base - i, 0) * 24 * 60 * 60 * 1000);
    });
    return compra;
  };
  
  const compraTomas = comprar(tomas, nocheRock, 1, 2, EstadoCompra.UTILIZADA);
  const compraAna = comprar(ana, cosquin, 1, 2, EstadoCompra.UTILIZADA);
  const compraMer = comprar(mer, cosquin, 1, 1, EstadoCompra.UTILIZADA);

  const reseniaService = new ReseniaService(reseniaRepository, compraRepository, organizadorRepository);
  reseniaService.crear({ usuarioId: mer.id, compraId: compraMer.id, puntuacion: 4, detalle: "Muy buen festival" });
  reseniaService.crear({ usuarioId: tomas.id, compraId: compraTomas.id, puntuacion: 3, detalle: "El sonido podia mejorar" });
  
  comprar(ana, coldplay, 1, 2, EstadoCompra.CONFIRMADA);
  comprar(mer, coldplay, 1, 1);
  comprar(ana, jazz, 2, 1, EstadoCompra.CONFIRMADA);
  comprar(mer, hamlet, 1, 2, EstadoCompra.CONFIRMADA);
  comprar(tomas, nocheRock, 1, 2, EstadoCompra.UTILIZADA);
  comprar(mer, nocheRock, 1, 1, EstadoCompra.CONFIRMADA);
  comprar(ana, standUp, 1, 2, EstadoCompra.CONFIRMADA);

  nocheRock.fecha = "2025-06-01";
  cosquin.fecha = "2025-02-15";
  
}

module.exports = cargarDatos;