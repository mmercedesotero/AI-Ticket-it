const Evento = require("../models/Evento");
const ValidationError = require("../errors/ValidationError");
const pick = require("../utils/pick");
const Entrada = require("../models/Entrada");
const NotFoundError = require("../errors/NotFoundError");

const fechaValida = (fecha) => {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const date = new Date(anio, mes - 1, dia);

  return (
    date.getFullYear() === anio &&
    date.getMonth() === mes - 1 &&
    date.getDate() === dia
  );
};

const normalizar = (texto) =>
  String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

class EventoService {
  constructor(
    eventoRepository,
    reseniaRepository,
    categoriaRepository,
    organizadorRepository,
    notificacionService
  ) {
    this.notificacionService = notificacionService;
    this.eventoRepository = eventoRepository;
    this.reseniaRepository = reseniaRepository;
    this.categoriaRepository = categoriaRepository;
    this.organizadorRepository = organizadorRepository;
  }

  obtenerTodos() {
    return this.eventoRepository.findAll();
  }

  obtenerPorId(id) {
    return this.eventoRepository.findById(id);
  }

  puntajeDelOrganizador(evento) {
    if (!evento.organizador) return null;

    const resenias = this.reseniaRepository
      .findAll()
      .filter(
        (r) =>
          r.evento.organizador &&
          String(r.evento.organizador.id) === String(evento.organizador.id)
      );
    if (resenias.length === 0) return null;

    const suma = resenias.reduce((total, r) => total + r.puntuacion, 0);
    return suma / resenias.length;
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
      puntaje: (a, b) =>
        (this.puntajeDelOrganizador(a) ?? 0) -
        (this.puntajeDelOrganizador(b) ?? 0),
    };

    const comparar = criterios[orden];
    if (!comparar)
      throw new ValidationError("Orden no válido: usá precio, fecha o puntaje");

    const ordenados = [...eventos].sort(comparar);
    return direccion === "desc" ? ordenados.reverse() : ordenados;
  }

  crear(datos = {}) {
    const { nombre, fecha, descripcion, categoriaId, organizadorId, tiposEntrada } = datos;

    if (typeof nombre !== "string" || nombre.trim() === "")
      throw new ValidationError("El nombre es obligatorio");

    if (!fechaValida(fecha))
      throw new ValidationError("La fecha debe ser válida y tener formato AAAA-MM-DD");

    if (!Array.isArray(tiposEntrada) || tiposEntrada.length === 0)
      throw new ValidationError("El evento necesita al menos un tipo de entrada");

    const entradas = tiposEntrada.map((tipo, i) => {
      const { nombre, precio, ubicacion, cupoDisponible } = tipo ?? {};

      if (typeof nombre !== "string" || nombre.trim() === "")
        throw new ValidationError(`La entrada ${i + 1} necesita un nombre`);
      if (typeof precio !== "number")
        throw new ValidationError(`El precio de "${nombre}" debe ser un número, sin comillas`);
      if (precio < 0)
        throw new ValidationError(`El precio de "${nombre}" no puede ser negativo`);
      if (typeof cupoDisponible !== "number")
        throw new ValidationError(`El cupo de "${nombre}" debe ser un número, sin comillas`);
      if (!Number.isInteger(cupoDisponible) || cupoDisponible <= 0)
        throw new ValidationError(`El cupo de "${nombre}" debe ser un entero mayor a 0`);

      return new Entrada(i + 1, nombre.trim(), precio, ubicacion, cupoDisponible);
    });

    const categoria = this.categoriaRepository.findById(categoriaId);
    if (!categoria) throw new NotFoundError("Categoría no encontrada");

    const organizador = this.organizadorRepository.findById(organizadorId);
    if (!organizador) throw new NotFoundError("Organizador no encontrado");

    const evento = new Evento(
      undefined,
      nombre.trim(),
      fecha,
      typeof descripcion === "string" ? descripcion.trim() : "",
      categoria,
      entradas,
      datos.multimedia ?? [],
      organizador
    );
    if (evento.yaSeRealizo())
      throw new ValidationError("La fecha del evento no puede ser pasada");

    this.eventoRepository.save(evento);
    organizador.eventos.push(evento);

    if (this.notificacionService) {
      this.notificacionService.crear("ORGANIZADOR", organizador.id, {
        tipo: "EVENTO_PUBLICADO",
        titulo: "Evento publicado",
        mensaje: `${evento.nombre} ya está a la venta.`,
      });
    }

    return evento;
  }

  actualizar(id, datos) {
    return this.eventoRepository.update(
      id,
      pick(datos, ["nombre", "fecha", "descripcion", "categoria", "tiposEntrada", "multimedia"])
    );
  }

  eliminar(id) {
    return this.eventoRepository.delete(id);
  }
}

module.exports = EventoService;