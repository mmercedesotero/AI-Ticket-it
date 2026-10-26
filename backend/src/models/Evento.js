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
}

module.exports = Evento;
