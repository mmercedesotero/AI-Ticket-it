const Resenia = require("../models/Resenia");
const EstadoCompra = require("../models/EstadoCompra");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

class ReseniaService {
  constructor(reseniaRepository, compraRepository, organizadorRepository) {
    this.reseniaRepository = reseniaRepository;
    this.compraRepository = compraRepository;
    this.organizadorRepository = organizadorRepository;
  }

  crear({ compraId, puntuacion, detalle } = {}) {
    const compra = this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (compra.estado !== EstadoCompra.UTILIZADA)
      throw new ValidationError(
        "Solo se puede puntuar un evento con la entrada utilizada"
      );

    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5)
      throw new ValidationError("La puntuación debe ser un entero entre 1 y 5");

    if (typeof detalle !== "string" || detalle.trim() === "")
      throw new ValidationError("El comentario no puede estar vacío");

    const yaPuntuo = this.reseniaRepository
      .findAll()
      .some(
        (resenia) =>
          String(resenia.comprador.id) === String(compra.comprador.id) &&
          String(resenia.evento.id) === String(compra.evento.id)
      );
    if (yaPuntuo) throw new ValidationError("Ya puntuaste este evento");

    const resenia = new Resenia(
      undefined,
      compra.comprador,
      compra.evento,
      detalle.trim(),
      puntuacion
    );

    return this.aVista(this.reseniaRepository.save(resenia));
  }

  obtenerTodas({ organizadorId } = {}) {
    if (organizadorId === undefined) {
      return this.reseniaRepository.findAll().map((r) => this.aVista(r));
    }

    const organizador = this.organizadorRepository.findById(organizadorId);
    if (!organizador) throw new NotFoundError("Organizador no encontrado");

    const resenias = this.reseniaRepository
      .findAll()
      .filter(
        (r) =>
          r.evento.organizador &&
          String(r.evento.organizador.id) === String(organizador.id)
      );

    const suma = resenias.reduce((total, r) => total + r.puntuacion, 0);

    return {
      organizador: { id: organizador.id, nombre: organizador.nombre },
      puntajePromedio: resenias.length
        ? Number((suma / resenias.length).toFixed(1))
        : null,
      cantidad: resenias.length,
      resenias: resenias.map((r) => this.aVista(r)),
    };
  }

  aVista(resenia) {
    return {
      id: resenia.id,
      comprador: `${resenia.comprador.nombre} ${resenia.comprador.apellido}`,
      evento: { id: resenia.evento.id, nombre: resenia.evento.nombre },
      detalle: resenia.detalle,
      puntuacion: resenia.puntuacion,
    };
  }
}

module.exports = ReseniaService;
