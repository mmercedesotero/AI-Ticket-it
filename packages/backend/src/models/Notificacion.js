// Un aviso para un comprador o un organizador. Se identifica al destinatario con su rol y su id.
class Notificacion {
  constructor(id, rol, destinatarioId, tipo, titulo, mensaje, clave = null, compraId = null) {
    this.id = id;
    this.rol = rol;
    this.destinatarioId = destinatarioId;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    // Identifica avisos que no deben repetirse (por ejemplo, el recordatorio de una misma compra).
    this.clave = clave;
    // Compra a la que se refiere el aviso (por ejemplo, la del chat de un mensaje nuevo).
    this.compraId = compraId;
    this.fechaHora = new Date();
    this.leida = false;
  }
}

module.exports = Notificacion;
