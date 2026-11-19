// Un aviso para un comprador o un organizador. Se identifica al destinatario con su rol y su id.
class Notificacion {
  constructor(id, rol, destinatarioId, tipo, titulo, mensaje) {
    this.id = id;
    this.rol = rol;
    this.destinatarioId = destinatarioId;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.fechaHora = new Date();
    this.leida = false;
  }
}

module.exports = Notificacion;
