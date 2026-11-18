const Compra = require("../models/Compra");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");
const EstadoCompra = require("../models/EstadoCompra");
const Mensaje = require("../models/Mensaje");

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
    
    if (evento.yaSeRealizo()) throw new ValidationError("El evento ya se realizó");

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
  obtenerPorUsuario(usuarioId) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    return this.compraRepository
      .findAll()
      .filter((compra) => String(compra.comprador.id) === String(usuarioId))
      .map((compra) => ({
        ...compra,
        diasParaEvento:
          compra.estado === EstadoCompra.CONFIRMADA
            ? compra.diasParaElEvento()
            : null,
      }));
  }

  obtenerPorEvento(eventoId) {
    const evento = this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    const compras = this.compraRepository
      .findAll()
      .filter((compra) => String(compra.evento.id) === String(eventoId))
      .map((compra) => ({
        id: compra.id,
        comprador: `${compra.comprador.nombre} ${compra.comprador.apellido}`,
        tipoEntrada: compra.tipoEntrada.nombre,
        cantidad: compra.cantidad,
        total: compra.total,
        estado: compra.estado,
      }));

    const entradasDisponibles = evento.tiposEntrada.map((tipo) => ({
      id: tipo.id,
      nombre: tipo.nombre,
      cupoDisponible: tipo.cupoDisponible,
    }));

    return {
      evento: { id: evento.id, nombre: evento.nombre },
      compras,
      entradasDisponibles,
    };
  }

    obtenerPorUsuario(usuarioId) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    return this.compraRepository
      .findAll()
      .filter((compra) => String(compra.comprador.id) === String(usuarioId))
      .map((compra) => {
        const dias = compra.diasParaElEvento();

        return {
          ...compra,
          diasParaEvento:
            compra.estado === EstadoCompra.CONFIRMADA && dias >= 0 ? dias : null,
        };
      });
  }
    cancelarCompra(id) {
    const compra = this.compraRepository.findById(id);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (compra.estado === EstadoCompra.UTILIZADA)
      throw new ValidationError("No se puede cancelar una compra ya utilizada");

    if (
      compra.estado === EstadoCompra.CANCELADA ||
      compra.estado === EstadoCompra.REEMBOLSADA
    )
      throw new ValidationError("La compra ya fue cancelada");

    if (compra.diasParaElEvento() < 0)
      throw new ValidationError(
        "No se puede cancelar una compra de un evento que ya se realizó"
      );

    const fuePagada = compra.estado === EstadoCompra.CONFIRMADA;
    compra.actualizarEstado(
      fuePagada ? EstadoCompra.REEMBOLSADA : EstadoCompra.CANCELADA
    );
    compra.tipoEntrada.cupoDisponible += compra.cantidad;

    return compra;
  }
  
  obtenerMensajes(compraId) {
    const compra = this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    return compra.mensajes;
  }

  enviarMensaje(compraId, { autorId, rol, texto } = {}) {
    const compra = this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (typeof texto !== "string" || texto.trim() === "")
      throw new ValidationError("El mensaje no puede estar vacío");

    if (rol !== "COMPRADOR" && rol !== "ORGANIZADOR")
      throw new ValidationError("El rol debe ser COMPRADOR u ORGANIZADOR");

    const participante =
      rol === "COMPRADOR" ? compra.comprador : compra.evento.organizador;
    if (!participante || String(participante.id) !== String(autorId))
      throw new ValidationError("El autor no participa de esta compra");

    const nombre =
      rol === "COMPRADOR"
        ? `${participante.nombre} ${participante.apellido}`
        : participante.nombre;
    const autor = { id: participante.id, nombre, rol };

    const mensaje = new Mensaje(compra.mensajes.length + 1, autor, texto.trim());
    compra.mensajes.push(mensaje);

    return mensaje;
  }
}

module.exports = CompraService;
