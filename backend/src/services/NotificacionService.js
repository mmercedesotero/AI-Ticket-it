const Notificacion = require("../models/Notificacion");
const NotFoundError = require("../errors/NotFoundError");

const { HORAS_RESERVA, HORAS_AVISO, MS_POR_HORA, creadaEn } = require("../utils/reservas");
const EstadoCompra = require("../models/EstadoCompra");

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

    this.procesarReservas(usuario);

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

  // Reservas sin pagar: a las HORAS_AVISO se avisa que hay que abonar y a las HORAS_RESERVA se cancelan
  // (las entradas vuelven a quedar disponibles). Se revisa al consultar, sin un proceso que corra por tiempo.
  procesarReservas(usuario) {
    if (!this.compraRepository) return;

    const ahora = Date.now();

    this.compraRepository
      .findAll()
      .filter((c) => String(c.comprador.id) === String(usuario.id) && c.estado === EstadoCompra.PENDIENTE_PAGO)
      .forEach((compra) => {
        const horas = (ahora - creadaEn(compra)) / MS_POR_HORA;

        if (horas >= HORAS_RESERVA) {
          compra.actualizarEstado(EstadoCompra.CANCELADA);
          compra.tipoEntrada.cupoDisponible += compra.cantidad;
          this.crear("COMPRADOR", usuario.id, {
            tipo: "RESERVA_VENCIDA",
            titulo: "Tu reserva venció",
            mensaje: `No pagaste a tiempo tu reserva de ${compra.evento.nombre} y se canceló. Las entradas volvieron a estar disponibles.`,
            clave: `reserva-vencida-${compra.id}`,
          });
        } else if (horas >= HORAS_AVISO) {
          const restantes = Math.max(1, Math.ceil(HORAS_RESERVA - horas));
          this.crear("COMPRADOR", usuario.id, {
            tipo: "RECORDATORIO_PAGO",
            titulo: "Recordá abonar tu entrada",
            mensaje: `Tu reserva de ${compra.evento.nombre} vence en unas ${restantes} horas. Pagala desde Mis compras para no perder tus entradas.`,
            clave: `recordatorio-pago-${compra.id}`,
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
