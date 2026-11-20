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
    this.portada = null; // imagen de portada (data URI); se entrega por /eventos/:id/portada
  }

  // La imagen no se manda dentro del JSON (pesa mucho): se avisa dónde pedirla.
  toJSON() {
    return { ...this, portada: this.portada ? `/eventos/${this.id}/portada` : null };
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