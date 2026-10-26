const EstadoCompra = require("./EstadoCompra");

class Compra {
  constructor(
    id,
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    total,
    estado = EstadoCompra.PENDIENTE_PAGO,
    mensajes = []
  ) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = total;
    this.estado = estado;
    this.mensajes = mensajes;
  }

  actualizarEstado(estadoCompra) {
    if (!Object.values(EstadoCompra).includes(estadoCompra)) {
      throw new RangeError(`Estado de compra no válido: ${estadoCompra}`);
    }

    this.estado = estadoCompra;
  }
}

module.exports = Compra;