class NotificacionRepository {
  constructor() {
    this.notificaciones = [];
  }

  save(notificacion) {
    if (notificacion.id === undefined || notificacion.id === null) {
      notificacion.id =
        Math.max(0, ...this.notificaciones.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.notificaciones.push(notificacion);
    return notificacion;
  }

  findByDestinatario(rol, destinatarioId) {
    return this.notificaciones.filter(
      (n) => n.rol === rol && String(n.destinatarioId) === String(destinatarioId)
    );
  }
}

module.exports = NotificacionRepository;
