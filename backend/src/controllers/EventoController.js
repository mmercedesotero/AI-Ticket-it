class EventoController {
  constructor(eventoService) {
    this.eventoService = eventoService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.crear = this.crear.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.eventoService.obtenerTodos());
  }

  obtenerPorId(req, res) {
    const evento = this.eventoService.obtenerPorId(req.params.id);

    if (!evento) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(evento);
  }

  crear(req, res) {
    const evento = this.eventoService.crear(req.body);
    res.status(201).json(evento);
  }

  actualizar(req, res) {
    const evento = this.eventoService.actualizar(req.params.id, req.body);

    if (!evento) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(evento);
  }

  eliminar(req, res) {
    const eliminado = this.eventoService.eliminar(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.status(204).end();
  }
}

module.exports = EventoController;