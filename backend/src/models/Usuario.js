class Usuario {
  constructor(id, nombre, apellido, email = null, passwordHash = null) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.passwordHash = passwordHash;
    this.favoritos = [];
    this.entradasCompradas = [];
  }

  // Nunca devolvemos el hash de la contraseña en las respuestas.
  toJSON() {
    const { passwordHash, ...datos } = this;
    return datos;
  }
}

module.exports = Usuario;
