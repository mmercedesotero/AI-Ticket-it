class Evento {
  constructor(
    id,
    nombre,
    fecha,
    descripcion,
    categoria = null,
    tiposEntrada = [],
    multimedia = [],
    organizador = null
  ) {
    this.id = id;
    this.nombre = nombre;
    this.fecha = fecha;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.tiposEntrada = tiposEntrada;
    this.multimedia = multimedia;
    this.organizador = organizador;
  }

  tuPrecioEstaEntre(min, max) {
    return this.tiposEntrada.some(
      (entrada) => entrada.precio >= min && entrada.precio <= max
    );
  }

  yaSeRealizo() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return new Date(`${this.fecha}T00:00:00`) < hoy;
  }
  precioDesde() {
    if (this.tiposEntrada.length === 0) return null;
    return Math.min(...this.tiposEntrada.map((entrada) => entrada.precio));
  }
}

module.exports = Evento;