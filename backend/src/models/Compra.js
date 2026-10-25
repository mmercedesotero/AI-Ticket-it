const EstadoCompra = require("./estadoCompra");

class Compra {
  constructor(
    id,
    comprador,
    evento,
    tipoDeEntrada,
    cantidad,
    total,
    mensajes = [],
    estado = EstadoCompra.PENDIENTE_PAGO
  ) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.estado = estado;
    this.tipoDeEntrada = tipoDeEntrada;
    this.cantidad = cantidad;
    this.total = total;
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