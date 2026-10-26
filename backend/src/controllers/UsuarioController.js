class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.crear = this.crear.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.usuarioService.obtenerTodos());
  }

  obtenerPorId(req, res) {
    const usuario = this.usuarioService.obtenerPorId(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  }

  crear(req, res) {
    const usuario = this.usuarioService.crear(req.body);
    res.status(201).json(usuario);
  }

  actualizar(req, res) {
    const usuario = this.usuarioService.actualizar(req.params.id, req.body);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  }

  eliminar(req, res) {
    const eliminado = this.usuarioService.eliminar(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(204).end();
  }
}

module.exports = UsuarioController;