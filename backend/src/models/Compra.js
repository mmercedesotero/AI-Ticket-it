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
  diasParaElEvento() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaEvento = new Date(`${this.evento.fecha}T00:00:00`);
    const MS_POR_DIA = 1000 * 60 * 60 * 24;

    return Math.round((fechaEvento - hoy) / MS_POR_DIA);
  }
}

module.exports = Compra;