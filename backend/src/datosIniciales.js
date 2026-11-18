const Usuario = require("./models/Usuario");
const Organizador = require("./models/Organizador");
const Categoria = require("./models/Categoria");
const Evento = require("./models/Evento");
const Entrada = require("./models/Entrada");
const EstadoCompra = require("./models/EstadoCompra");
const CompraService = require("./services/CompraService");
const { usuarioRepository, eventoRepository, organizadorRepository, compraRepository } = require("./container");

function cargarDatos() {
  const ana = usuarioRepository.save(new Usuario(undefined, "Ana", "Perez"));
  const liveNation = organizadorRepository.save(new Organizador(undefined, "Live Nation"));
  const recital = new Categoria(1, "Recital", "Musica en vivo");
  const evento = eventoRepository.save(new Evento(
    undefined, "Coldplay", "2027-01-10", "Gira mundial", recital,
    [new Entrada(1, "General", 80000, "Campo", 100),
     new Entrada(2, "VIP", 200000, "Palco", 20)],
    [], liveNation
  ));
  liveNation.eventos.push(evento);

  const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository);
  const compra = compraService.comprarEntrada({ usuarioId: ana.id, eventoId: evento.id, entradaId: 1, cantidad: 2 });
  compra.actualizarEstado(EstadoCompra.CONFIRMADA);
}

module.exports = cargarDatos;