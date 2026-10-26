const Compra = require("../models/Compra");
const NotFoundError = require("../errors/NotFoundError")
const ValidationError = require("../errors/ValidationError")

class CompraService {
  constructor(compraRepository, usuarioRepository, eventoRepository) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  obtenerTodos() {
    return this.compraRepository.findAll();
  }

  obtenerPorId(id) {
    return this.compraRepository.findById(id);
  }

  crear(datos = {}) {
    const compra = new Compra(
      undefined,
      datos.comprador,
      datos.evento,
      datos.tipoEntrada,
      datos.cantidad,
      datos.total
    );

    return this.compraRepository.save(compra);
  }

  actualizar(id, datos) {
    return this.compraRepository.update(id, datos);
  }

  eliminar(id) {
    return this.compraRepository.delete(id);
  }

  comprarEntrada({ usuarioId, eventoId, entradaId, cantidad } = {}) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    const evento = this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    const entrada = evento.tiposEntrada.find(
      (tipo) => String(tipo.id) === String(entradaId)
    );
    if (!entrada) throw new NotFoundError("Entrada no encontrada");

    if (!Number.isInteger(cantidad) || cantidad <= 0)
      throw new ValidationError("La cantidad debe ser un entero mayor a 0");

    if (cantidad > entrada.cupoDisponible)
      throw new ValidationError("No hay cupo suficiente para esa cantidad");

    const total = entrada.precio * cantidad;

    const compra = new Compra(undefined, usuario, evento, entrada, cantidad, total);
    entrada.cupoDisponible -= cantidad;

    return this.compraRepository.save(compra);
  }
}

module.exports = CompraService;
