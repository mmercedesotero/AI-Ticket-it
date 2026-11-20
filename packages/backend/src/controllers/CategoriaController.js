class CategoriaController {
  constructor(categoriaService) {
    this.categoriaService = categoriaService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.crear = this.crear.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.categoriaService.obtenerTodos());
  }

  crear(req, res) {
    res.status(201).json(this.categoriaService.crear(req.body));
  }
}

module.exports = CategoriaController;