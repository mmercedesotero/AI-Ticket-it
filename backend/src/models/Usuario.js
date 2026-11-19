class Usuario {
  constructor(id, nombre, apellido, email = null, passwordHash = null) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.passwordHash = passwordHash;
    this.favoritos = [];
    this.entradasCompradas = [];
    this.tarjetas = [];
  }

  // Nunca devolvemos el hash de la contraseña ni las tarjetas en las respuestas.
  toJSON() {
    const { passwordHash, tarjetas, ...datos } = this;
    return datos;
  }
}

module.exports = Usuario;
