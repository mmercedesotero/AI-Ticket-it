class Mensaje {
  constructor(id, autor, texto, fechaHora = new Date()) {
    this.id = id;
    this.autor = autor;
    this.texto = texto;
    this.fechaHora = fechaHora;
  }
}

module.exports = Mensaje;
