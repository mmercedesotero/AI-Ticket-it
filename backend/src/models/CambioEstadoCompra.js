class CambioEstadoCompra {
  constructor(id, compra, estado, quien, fechaHora = new Date()) {
    this.id = id;
    this.compra = compra;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = fechaHora;
  }
}

module.exports = CambioEstadoCompra;
