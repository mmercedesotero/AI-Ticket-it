// Una tarjeta guardada. Es una simulación: nunca se guarda el número completo ni el CVV,
// solo la marca, los últimos 4 dígitos, el vencimiento y el titular.
// La "huella" (un hash del número) sirve para detectar tarjetas repetidas y no se muestra en las respuestas.
class Tarjeta {
  constructor(id, marca, ultimos4, vencimiento, titular, huella) {
    this.id = id;
    this.marca = marca;
    this.ultimos4 = ultimos4;
    this.vencimiento = vencimiento;
    this.titular = titular;
    this.huella = huella;
  }

  toJSON() {
    const { huella, ...datos } = this;
    return datos;
  }
}

module.exports = Tarjeta;
