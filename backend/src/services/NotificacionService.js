const Notificacion = require("../models/Notificacion");
const NotFoundError = require("../errors/NotFoundError");

class NotificacionService {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  crear(rol, destinatarioId, { tipo, titulo, mensaje }) {
    return this.notificacionRepository.save(
      new Notificacion(undefined, rol, destinatarioId, tipo, titulo, mensaje)
    );
  }

  // Las más nuevas primero, con la cantidad de las que todavía no se leyeron.
  obtener(rol, destinatarioId) {
    const notificaciones = this.notificacionRepository
      .findByDestinatario(rol, destinatarioId)
      .sort((a, b) => b.fechaHora - a.fechaHora || b.id - a.id);

    return {
      notificaciones,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
    };
  }

  marcarLeida(rol, destinatarioId, id) {
    const notificacion = this.notificacionRepository
      .findByDestinatario(rol, destinatarioId)
      .find((n) => String(n.id) === String(id));
    if (!notificacion) throw new NotFoundError("Notificación no encontrada");

    notificacion.leida = true;
    return this.obtener(rol, destinatarioId);
  }

  marcarTodasLeidas(rol, destinatarioId) {
    this.notificacionRepository
      .findByDestinatario(rol, destinatarioId)
      .forEach((n) => {
        n.leida = true;
      });

    return this.obtener(rol, destinatarioId);
  }
}

module.exports = NotificacionService;
