
class Organizador {
  constructor(id, nombre) {
    this.id = id;
    this.nombre = nombre;
    this.eventos = [];
  }
  toJSON() {
  return { id: this.id, nombre: this.nombre };
  }
}


module.exports = Organizador;
