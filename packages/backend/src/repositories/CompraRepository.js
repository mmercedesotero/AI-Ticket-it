class CompraRepository {
  constructor() {
    this.compras = [];
  }

  findAll() {
    return this.compras;
  }

  findById(id) {
    return this.compras.find((compra) => String(compra.id) === String(id));
  }

  save(compra) {
    if (compra.id === undefined || compra.id === null) {
      compra.id =
        Math.max(0, ...this.compras.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.compras.push(compra);
    return compra;
  }

  update(id, datosActualizados) {
    const compra = this.findById(id);

    if (!compra) {
      return null;
    }

    Object.assign(compra, datosActualizados);

    return compra;
  }

  delete(id) {
    const indice = this.compras.findIndex(
      (compra) => String(compra.id) === String(id)
    );

    if (indice === -1) {
      return false;
    }

    this.compras.splice(indice, 1);

    return true;
  }
}

module.exports = CompraRepository;
