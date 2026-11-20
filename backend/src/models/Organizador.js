class Organizador {
  constructor(id, nombre, email = null, passwordHash = null) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.eventos = [];
    this.telefono = "";
    this.ciudad = "";
    this.foto = null; // imagen en formato data URI
  }

  // Evita el JSON circular (organizador <-> eventos) y no expone el hash.
  toJSON() {
    return { id: this.id, nombre: this.nombre };
  }

  // Datos completos para el dueño de la cuenta.
  toPerfil() {
    return {
      id: this.id, nombre: this.nombre, email: this.email,
      telefono: this.telefono, ciudad: this.ciudad, foto: this.foto,
    };
  }
}

module.exports = Organizador;
