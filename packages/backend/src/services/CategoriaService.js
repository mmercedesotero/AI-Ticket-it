class CategoriaService {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  obtenerTodos() {
    return this.categoriaRepository.findAll();
  }
}

module.exports = CategoriaService;