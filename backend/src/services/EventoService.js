const Evento = require("../models/Evento");
const ValidationError = require("../errors/ValidationError");

const normalizar = (texto) =>
  String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

  buscar({ texto, categoriaId, precioMin, precioMax, orden, direccion } = {}) {
    let eventos = this.eventoRepository.findAll();

    if (texto) {
      const buscado = normalizar(texto);
      eventos = eventos.filter((evento) =>
        normalizar(`${evento.nombre} ${evento.descripcion}`).includes(buscado)
      );
    }

    if (categoriaId) {
      eventos = eventos.filter(
        (evento) =>
          evento.categoria && String(evento.categoria.id) === String(categoriaId)
      );
    }

    if (precioMin !== undefined || precioMax !== undefined) {
      const min = Number(precioMin ?? 0);
      const max = Number(precioMax ?? Infinity);
      eventos = eventos.filter((evento) => evento.tuPrecioEstaEntre(min, max));
    }

    return this.ordenar(eventos, orden, direccion);
  }

  ordenar(eventos, orden, direccion = "asc") {
    if (!orden) return eventos;

    const criterios = {
      precio: (a, b) =>
        (a.precioDesde() ?? Infinity) - (b.precioDesde() ?? Infinity),
      fecha: (a, b) => a.fecha.localeCompare(b.fecha),
    };

    const comparar = criterios[orden];
    if (!comparar) throw new ValidationError("Orden no válido: usá precio o fecha");

    const ordenados = [...eventos].sort(comparar);
    return direccion === "desc" ? ordenados.reverse() : ordenados;
  }

  crear(datos = {}) {
    const evento = new Evento(
      undefined,
      datos.nombre,
      datos.fecha,
      datos.descripcion,
      datos.categoria,
      datos.tiposEntrada,
      datos.multimedia,
      datos.organizador
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