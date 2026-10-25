class Mensaje {
  constructor(id, usuario, mensaje, enviado = new Date()) {
    this.id = id;
    this.usuario = usuario;
    this.mensaje = mensaje;
    this.enviado = enviado;
  }
}

module.exports = Mensaje;