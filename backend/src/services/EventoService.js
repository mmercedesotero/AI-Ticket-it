const Evento = require("../models/evento");

class EventoService {
  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  obtenerTodos() {
    return this.eventoRepository.findAll();
  }

  obtenerPorId(id) {
    return this.eventoRepository.findById(id);
  }

  crear(datos = {}) {
    const evento = new Evento(
      undefined,
      datos.nombre,
      datos.fecha,
      datos.descripcion,
      datos.entrada,
      datos.categoria,
      datos.tiposEntrada,
      datos.multimedia,
      datos.organizador,
      datos.tuPrecioEstaEntre
    );

    return this.eventoRepository.save(evento);
  }

  actualizar(id, datos) {
    return this.eventoRepository.update(id, datos);
  }

  eliminar(id) {
    return this.eventoRepository.delete(id);
  }
}

module.exports = EventoService;