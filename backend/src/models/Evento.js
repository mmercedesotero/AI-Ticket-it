class Evento {
  constructor(
    id,
    nombre,
    fecha,
    descripcion,
    entrada = [],
    categoria = null,
    tiposEntrada = [],
    multimedia = [],
    organizador = null,
  ) {
    this.id = id;
    this.nombre = nombre;
    this.fecha = fecha;
    this.descripcion = descripcion;
    this.entrada = entrada;
    this.categoria = categoria;
    this.tiposEntrada = tiposEntrada;
    this.multimedia = multimedia;
    this.organizador = organizador;

  }
}

 // tuPrecioEstaEntre(min, max)

module.exports = Evento;