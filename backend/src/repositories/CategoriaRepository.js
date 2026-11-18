class CategoriaRepository {
  constructor() {
    this.categorias = [];
  }

  findAll() {
    return this.categorias;
  }

  findById(id) {
    return this.categorias.find(
      (categoria) => String(categoria.id) === String(id)
    );
  }

  save(categoria) {
    if (categoria.id === undefined || categoria.id === null) {
      categoria.id =
        Math.max(0, ...this.categorias.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.categorias.push(categoria);
    return categoria;
  }
}

module.exports = CategoriaRepository;