class Usuario {
  constructor(id, nombre, apellido) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.favoritos = [];
    this.entradasCompradas = [];
  }
}

module.exports = Usuario;