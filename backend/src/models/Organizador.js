class Organizador {
  constructor(id, nombre, email = null, passwordHash = null) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.eventos = [];
  }

  // Evita el JSON circular (organizador <-> eventos) y no expone el hash.
  toJSON() {
    return { id: this.id, nombre: this.nombre };
  }
}

module.exports = Organizador;
