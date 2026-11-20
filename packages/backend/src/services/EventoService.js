const Evento = require("../models/Evento");
const ValidationError = require("../errors/ValidationError");
const pick = require("../utils/pick");
const { validarImagen } = require("../utils/imagen");
const Entrada = require("../models/Entrada");
const NotFoundError = require("../errors/NotFoundError");
const ForbiddenError = require("../errors/ForbiddenError");

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
    notificacionService,
    compraRepository,
    usuarioRepository
  ) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
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
      // Cada palabra buscada tiene que ser el comienzo de alguna palabra del evento: "cena" encuentra
      // "Cena Show de Tango" pero no "escenarios" (que la contiene en el medio).
      const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
      const escapar = (palabra) => palabra.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patrones = palabras.map((p) => new RegExp(`(^|[^a-z0-9])${escapar(p)}`));

      eventos = eventos.filter((evento) => {
        const contenido = normalizar(`${evento.nombre} ${evento.descripcion}`);
        return patrones.every((patron) => patron.test(contenido));
      });
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

    const portada = validarImagen(datos.portada, "La portada");

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
    evento.portada = portada;
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

  // Busca el evento y comprueba que sea del organizador que lo quiere modificar.
  obtenerPropio(id, organizadorId) {
    const evento = this.eventoRepository.findById(id);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    if (!evento.organizador || String(evento.organizador.id) !== String(organizadorId))
      throw new ForbiddenError("Este evento no es tuyo");

    return evento;
  }

  // Compras que todavía cuentan para el evento: pendientes de pago o confirmadas.
  comprasActivas(evento) {
    return this.compraRepository
      .findAll()
      .filter((c) => c.evento.id === evento.id && (c.estado === "PENDIENTE_PAGO" || c.estado === "CONFIRMADA"));
  }

  // Edita un evento que todavía no se realizó. Solo se cambian los campos que vienen en el pedido.
  // Los tipos de entrada existentes se editan por su id (no se pueden borrar: ya pueden tener ventas) y los nuevos se agregan.
  actualizar(id, datos = {}, organizadorId) {
    const evento = this.obtenerPropio(id, organizadorId);

    if (evento.yaSeRealizo())
      throw new ValidationError("No se puede editar un evento que ya se realizó");

    const cambios = {};

    if (datos.nombre !== undefined) {
      if (typeof datos.nombre !== "string" || datos.nombre.trim() === "")
        throw new ValidationError("El nombre es obligatorio");
      cambios.nombre = datos.nombre.trim();
    }

    if (datos.fecha !== undefined) {
      if (!fechaValida(datos.fecha))
        throw new ValidationError("La fecha debe ser válida y tener formato AAAA-MM-DD");
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (new Date(`${datos.fecha}T00:00:00`) < hoy)
        throw new ValidationError("La fecha del evento no puede ser pasada");
      cambios.fecha = datos.fecha;
    }

    if (datos.descripcion !== undefined) {
      if (typeof datos.descripcion !== "string") throw new ValidationError("La descripción debe ser un texto");
      cambios.descripcion = datos.descripcion.trim();
    }

    if (datos.categoriaId !== undefined) {
      const categoria = this.categoriaRepository.findById(datos.categoriaId);
      if (!categoria) throw new NotFoundError("Categoría no encontrada");
      cambios.categoria = categoria;
    }

    if ("portada" in datos) cambios.portada = validarImagen(datos.portada, "La portada");

    // Se valida todo antes de aplicar algo, para no dejar el evento a medias.
    const cambiosEntradas = [];
    const nuevasEntradas = [];
    if (datos.tiposEntrada !== undefined) {
      if (!Array.isArray(datos.tiposEntrada)) throw new ValidationError("Los tipos de entrada deben ser una lista");

      datos.tiposEntrada.forEach((tipo, i) => {
        const { id: tipoId, nombre, precio, ubicacion, cupoDisponible } = tipo ?? {};
        const nombreTipo = typeof nombre === "string" ? nombre.trim() : "";

        if (tipoId !== undefined) {
          const existente = evento.tiposEntrada.find((t) => String(t.id) === String(tipoId));
          if (!existente) throw new ValidationError(`La entrada ${i + 1} no existe en este evento`);

          const cambio = { existente };
          if (nombre !== undefined) {
            if (nombreTipo === "") throw new ValidationError(`La entrada ${i + 1} necesita un nombre`);
            cambio.nombre = nombreTipo;
          }
          if (precio !== undefined) {
            if (typeof precio !== "number" || precio < 0)
              throw new ValidationError(`El precio de "${existente.nombre}" debe ser un número, no negativo`);
            cambio.precio = precio;
          }
          if (ubicacion !== undefined) cambio.ubicacion = String(ubicacion);
          if (cupoDisponible !== undefined) {
            if (!Number.isInteger(cupoDisponible) || cupoDisponible < 0)
              throw new ValidationError(`El cupo de "${existente.nombre}" debe ser un entero de 0 o más`);
            cambio.cupoDisponible = cupoDisponible;
          }
          cambiosEntradas.push(cambio);
        } else {
          if (nombreTipo === "") throw new ValidationError(`La entrada nueva ${i + 1} necesita un nombre`);
          if (typeof precio !== "number" || precio < 0)
            throw new ValidationError(`El precio de "${nombreTipo}" debe ser un número, no negativo`);
          if (!Number.isInteger(cupoDisponible) || cupoDisponible <= 0)
            throw new ValidationError(`El cupo de "${nombreTipo}" debe ser un entero mayor a 0`);
          nuevasEntradas.push({ nombre: nombreTipo, precio, ubicacion, cupoDisponible });
        }
      });
    }

    const fechaAnterior = evento.fecha;
    Object.assign(evento, cambios);

    cambiosEntradas.forEach(({ existente, ...campos }) => Object.assign(existente, campos));
    nuevasEntradas.forEach((tipo) => {
      const nuevoId = Math.max(0, ...evento.tiposEntrada.map((t) => t.id)) + 1;
      evento.tiposEntrada.push(new Entrada(nuevoId, tipo.nombre, tipo.precio, tipo.ubicacion, tipo.cupoDisponible));
    });

    // Si cambió la fecha, se les avisa a quienes ya tienen entradas.
    if (cambios.fecha && cambios.fecha !== fechaAnterior && this.notificacionService) {
      const avisados = new Set();
      this.comprasActivas(evento).forEach((compra) => {
        if (avisados.has(compra.comprador.id)) return;
        avisados.add(compra.comprador.id);
        this.notificacionService.crear("COMPRADOR", compra.comprador.id, {
          tipo: "EVENTO_MODIFICADO",
          titulo: "Cambió la fecha de tu evento",
          mensaje: `${evento.nombre} ahora es el ${cambios.fecha.split("-").reverse().join("/")}. Tus entradas siguen siendo válidas.`,
        });
      });
    }

    return evento;
  }

  // Elimina un evento que todavía no se realizó. Las compras activas se cancelan (y se reembolsan las pagadas)
  // y se avisa a los compradores. Un evento ya realizado no se puede eliminar: queda en el historial y en las reseñas.
  eliminar(id, organizadorId) {
    const evento = this.obtenerPropio(id, organizadorId);

    if (evento.yaSeRealizo())
      throw new ValidationError("No se puede eliminar un evento que ya se realizó: queda en el historial");

    const activas = this.comprasActivas(evento);
    activas.forEach((compra) => {
      const fuePagada = compra.estado === "CONFIRMADA";
      compra.actualizarEstado(fuePagada ? "REEMBOLSADA" : "CANCELADA");

      if (this.notificacionService) {
        this.notificacionService.crear("COMPRADOR", compra.comprador.id, {
          tipo: fuePagada ? "REEMBOLSO" : "CANCELACION",
          titulo: "Se canceló tu evento",
          mensaje: fuePagada
            ? `El organizador canceló ${evento.nombre}. Te reembolsamos el pago de tus entradas.`
            : `El organizador canceló ${evento.nombre}. Tu reserva quedó sin efecto.`,
        });
      }
    });

    // Se quita de los favoritos, de la lista del organizador y del repositorio.
    if (this.usuarioRepository)
      this.usuarioRepository.findAll().forEach((u) => {
        u.favoritos = u.favoritos.filter((fav) => String(fav) !== String(evento.id));
      });
    evento.organizador.eventos = evento.organizador.eventos.filter((e) => e.id !== evento.id);
    this.eventoRepository.delete(evento.id);

    return { mensaje: "El evento fue eliminado.", comprasCanceladas: activas.length };
  }
}

module.exports = EventoService;