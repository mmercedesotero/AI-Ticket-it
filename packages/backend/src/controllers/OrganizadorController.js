class OrganizadorController {
  constructor(organizadorService) {
    this.organizadorService = organizadorService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.crear = this.crear.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.organizadorService.obtenerTodos());
  }

  obtenerPorId(req, res) {
    const organizador = this.organizadorService.obtenerPorId(req.params.id);

    if (!organizador) {
      return res.status(404).json({ error: "Organizador no encontrado" });
    }

    res.json(organizador);
  }

  crear(req, res) {
    const organizador = this.organizadorService.crear(req.body);
    res.status(201).json(organizador);
  }

  actualizar(req, res) {
    const organizador = this.organizadorService.actualizar(
      req.params.id,
      req.body
    );

    if (!organizador) {
      return res.status(404).json({ error: "Organizador no encontrado" });
    }

    res.json(organizador);
  }

  eliminar(req, res) {
    const eliminado = this.organizadorService.eliminar(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ error: "Organizador no encontrado" });
    }

    res.status(204).end();
  }
}

module.exports = OrganizadorController;
