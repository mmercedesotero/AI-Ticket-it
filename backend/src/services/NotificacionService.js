const Notificacion = require("../models/Notificacion");
const NotFoundError = require("../errors/NotFoundError");

class NotificacionService {
  constructor(notificacionRepository, compraRepository) {
    this.notificacionRepository = notificacionRepository;
    this.compraRepository = compraRepository;
  }

  crear(rol, destinatarioId, { tipo, titulo, mensaje, clave = null }) {
    // Si ya existe un aviso con la misma clave no se vuelve a crear.
    if (clave) {
      const repetida = this.notificacionRepository
        .findByDestinatario(rol, destinatarioId)
        .find((n) => n.clave === clave);
      if (repetida) return repetida;
    }

    return this.notificacionRepository.save(
      new Notificacion(undefined, rol, destinatarioId, tipo, titulo, mensaje, clave)
    );
  }

  // Recordatorios para el comprador: avisa el día anterior y el mismo día de cada evento con entrada confirmada.
  // Se calculan al consultar las notificaciones, así no hace falta un proceso que corra por tiempo.
  generarRecordatorios(usuario) {
    if (!this.compraRepository) return;

    this.compraRepository
      .findAll()
      .filter((c) => String(c.comprador.id) === String(usuario.id) && c.estado === "CONFIRMADA")
      .forEach((compra) => {
        const dias = compra.diasParaElEvento();

        if (dias === 1) {
          this.crear("COMPRADOR", usuario.id, {
            tipo: "RECORDATORIO",
            titulo: "Tu evento es mañana",
            mensaje: `${compra.evento.nombre} es mañana. ¡No te olvides de llevar tu entrada!`,
            clave: `recordatorio-manana-${compra.id}`,
          });
        }

        if (dias === 0) {
          this.crear("COMPRADOR", usuario.id, {
            tipo: "RECORDATORIO",
            titulo: "¡Tu evento es hoy!",
            mensaje: `Hoy es ${compra.evento.nombre}. Tené a mano el código QR de tu entrada.`,
            clave: `recordatorio-hoy-${compra.id}`,
          });
        }
      });
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
