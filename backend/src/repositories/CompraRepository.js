class CompraRepository {
  constructor() {
    this.compras = [];
  }

  findAll() {
    return this.compras;
  }

  findById(id) {
    return this.compras.find(compra => compra.id === id);
  }

  save(compra) {
    this.compras.push(compra);
    return compra;
  }
}

module.exports = CompraRepository;