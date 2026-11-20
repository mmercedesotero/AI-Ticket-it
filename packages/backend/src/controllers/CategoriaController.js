class CategoriaController {
  constructor(categoriaService) {
    this.categoriaService = categoriaService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.categoriaService.obtenerTodos());
  }
}

module.exports = CategoriaController;