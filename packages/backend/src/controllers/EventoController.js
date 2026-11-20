const { decodificarImagen } = require("../utils/imagen");

class EventoController {
  constructor(eventoService) {
    this.eventoService = eventoService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.portada = this.portada.bind(this);
    this.crear = this.crear.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.eventoService.buscar(req.query));
  }
  obtenerPorId(req, res) {
    const evento = this.eventoService.obtenerPorId(req.params.id);

    if (!evento) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(evento);
  }

  // Devuelve la imagen de portada como imagen (la app la pide con una URL normal).
  portada(req, res) {
    const evento = this.eventoService.obtenerPorId(req.params.id);
    if (!evento || !evento.portada) return res.status(404).json({ error: "Este evento no tiene portada" });

    const { tipo, datos } = decodificarImagen(evento.portada);
    res.set("Content-Type", tipo);
    res.set("Cache-Control", "public, max-age=300");
    res.send(datos);
  }

  crear(req, res) {
    const evento = this.eventoService.crear({
      ...req.body,
      organizadorId: req.organizador.id,
    });
    res.status(201).json(evento);
  }

  actualizar(req, res) {
    res.json(this.eventoService.actualizar(req.params.id, req.body, req.organizador.id));
  }

  eliminar(req, res) {
    res.json(this.eventoService.eliminar(req.params.id, req.organizador.id));
  }
}

module.exports = EventoController;