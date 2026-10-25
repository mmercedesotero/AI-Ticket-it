class Organizador {
  constructor(id, nombre) {
    this.id = id;
    this.nombre = nombre;
    this.eventos = [];
    this.ventas = [];
  }
}

module.exports = Organizador;