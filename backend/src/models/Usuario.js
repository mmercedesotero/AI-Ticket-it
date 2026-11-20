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
    this.telefono = "";
    this.ciudad = "";
    this.foto = null; // imagen en formato data URI
    this.pagoRapido = true; // elegir automáticamente la primera tarjeta al pagar
  }

  // Nunca devolvemos el hash de la contraseña ni las tarjetas en las respuestas.
  toJSON() {
    const { passwordHash, tarjetas, telefono, ciudad, foto, pagoRapido, ...datos } = this;
    return datos;
  }

  // Datos completos para el dueño de la cuenta (login, registro y "mi perfil").
  toPerfil() {
    const { passwordHash, tarjetas, ...datos } = this;
    return datos;
  }
}

module.exports = Usuario;
