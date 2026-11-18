const Usuario = require("./models/Usuario");
const Organizador = require("./models/Organizador");
const Categoria = require("./models/Categoria");
const Evento = require("./models/Evento");
const Entrada = require("./models/Entrada");
const EstadoCompra = require("./models/EstadoCompra");
const CompraService = require("./services/CompraService");
const { usuarioRepository, eventoRepository, organizadorRepository, compraRepository, categoriaRepository, reseniaRepository } = require("./container");
const ReseniaService = require("./services/ReseniaService");

function cargarDatos() {
  const ana = usuarioRepository.save(new Usuario(undefined, "Ana", "Perez"));
  const mer = usuarioRepository.save(new Usuario(undefined, "Mer", "Perez"));
  const tomas = usuarioRepository.save(new Usuario(undefined, "Tomas", "Gomez"));
  const recital = categoriaRepository.save(new Categoria(undefined, "Recital", "Musica en vivo"));
  const teatro = categoriaRepository.save(new Categoria(undefined, "Teatro", "Obras y espectaculos"));
  const festival = categoriaRepository.save(new Categoria(undefined, "Festival", "Festivales de varios dias"));

  const liveNation = organizadorRepository.save(new Organizador(undefined, "Live Nation"));
  const teatroBA = organizadorRepository.save(new Organizador(undefined, "Teatro BA"));

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
  const [coldplay, jazz, hamlet, lolla, nocheRock, cosquin ] = eventos;

  const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository);
  const comprar = (usuario, evento, entradaId, cantidad, estado) => {
    const compra = compraService.comprarEntrada({
      usuarioId: usuario.id, eventoId: evento.id, entradaId, cantidad,
    });
    if (estado) compra.actualizarEstado(estado);
    return compra;
  };
  
  const compraTomas = comprar(tomas, nocheRock, 1, 2, EstadoCompra.UTILIZADA);
  const compraAna = comprar(ana, cosquin, 1, 2, EstadoCompra.UTILIZADA);
  const compraMer = comprar(mer, cosquin, 1, 1, EstadoCompra.UTILIZADA);

  const reseniaService = new ReseniaService(reseniaRepository, compraRepository, organizadorRepository);
  reseniaService.crear({ compraId: compraMer.id, puntuacion: 4, detalle: "Muy buen festival" });
  reseniaService.crear({ compraId: compraTomas.id, puntuacion: 3, detalle: "El sonido podia mejorar" });
  
  comprar(ana, coldplay, 1, 2, EstadoCompra.CONFIRMADA);
  comprar(mer, coldplay, 1, 1);
  comprar(ana, jazz, 2, 1, EstadoCompra.CONFIRMADA);
  comprar(mer, hamlet, 1, 2, EstadoCompra.CONFIRMADA);
  comprar(tomas, nocheRock, 1, 2, EstadoCompra.UTILIZADA);
  comprar(mer, nocheRock, 1, 1, EstadoCompra.CONFIRMADA);

  nocheRock.fecha = "2025-06-01";
  cosquin.fecha = "2025-02-15";
  
}

module.exports = cargarDatos;