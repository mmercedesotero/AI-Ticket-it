const Notificacion = require("../models/Notificacion");
const NotFoundError = require("../errors/NotFoundError");

const { HORAS_RESERVA, HORAS_AVISO, MS_POR_HORA, creadaEn } = require("../utils/reservas");
const EstadoCompra = require("../models/EstadoCompra");

class NotificacionService {
  constructor(notificacionRepository, compraRepository, eventoRepository) {
    this.eventoRepository = eventoRepository;
    this.notificacionRepository = notificacionRepository;
    this.compraRepository = compraRepository;
  }

  crear(rol, destinatarioId, { tipo, titulo, mensaje, clave = null, compraId = null }) {
    // Si ya existe un aviso con la misma clave no se vuelve a crear.
    if (clave) {
      const repetida = this.notificacionRepository
        .findByDestinatario(rol, destinatarioId)
        .find((n) => n.clave === clave);
      if (repetida) return repetida;
    }

    return this.notificacionRepository.save(
      new Notificacion(undefined, rol, destinatarioId, tipo, titulo, mensaje, clave, compraId)
    );
  }

  // Recordatorios para el comprador: avisa el día anterior y el mismo día de cada evento con entrada confirmada.
  // Se calculan al consultar las notificaciones, así no hace falta un proceso que corra por tiempo.
  // Aviso de mensaje nuevo en un chat. Si ya hay uno sin leer de ese mismo chat se actualiza en vez de
  // crear otro, para no llenar la lista cuando alguien escribe varias veces seguidas.
  avisarMensaje(rolDestino, destinatarioId, { compraId, remitente, evento, texto }) {
    const resumen = texto.length > 70 ? `${texto.slice(0, 70)}…` : texto;
    const datos = {
      tipo: "NUEVO_MENSAJE",
      titulo: `Nuevo mensaje de ${remitente}`,
      mensaje: `Te escribió por ${evento}: "${resumen}"`,
      compraId,
    };

    const sinLeer = this.notificacionRepository
      .findByDestinatario(rolDestino, destinatarioId)
      .find((n) => n.tipo === "NUEVO_MENSAJE" && n.compraId === compraId && !n.leida);

    if (sinLeer) {
      Object.assign(sinLeer, datos, { fechaHora: new Date() });
      return sinLeer;
    }
    return this.crear(rolDestino, destinatarioId, datos);
  }

  // Al abrir un chat se marcan como leídos sus avisos.
  marcarMensajesLeidos(rol, destinatarioId, compraId) {
    this.notificacionRepository
      .findByDestinatario(rol, destinatarioId)
      .filter((n) => n.tipo === "NUEVO_MENSAJE" && n.compraId === compraId)
      .forEach((n) => {
        n.leida = true;
      });
  }

  // Avisos para el organizador sobre sus eventos: mañana, hoy, pocas entradas y sin ventas.
  // Igual que los del comprador, se calculan al consultar y no se repiten (cada uno tiene su clave).
  generarAvisosOrganizador(organizador) {
    if (!this.compraRepository || !this.eventoRepository) return;

    const POCAS = 20;

    this.eventoRepository
      .findAll()
      .filter((e) => e.organizador && String(e.organizador.id) === String(organizador.id))
      .forEach((evento) => {
        const dias = Math.round(
          (new Date(`${evento.fecha}T00:00:00`) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
        );
        if (dias < 0) return;

        const vendidas = this.compraRepository
          .findAll()
          .filter((c) => c.evento.id === evento.id && c.estado !== "CANCELADA" && c.estado !== "REEMBOLSADA")
          .reduce((suma, c) => suma + c.cantidad, 0);
        const quedan = evento.tiposEntrada.reduce((suma, t) => suma + t.cupoDisponible, 0);
        const resumen = `Vendiste ${vendidas} ${vendidas === 1 ? "entrada" : "entradas"} y quedan ${quedan}.`;

        if (dias === 1) {
          this.crear("ORGANIZADOR", organizador.id, {
            tipo: "RECORDATORIO",
            titulo: "Mañana es tu evento",
            mensaje: `${evento.nombre} es mañana. ${resumen}`,
            clave: `org-manana-${evento.id}`,
          });
        }

        if (dias === 0) {
          this.crear("ORGANIZADOR", organizador.id, {
            tipo: "RECORDATORIO",
            titulo: "¡Hoy es tu evento!",
            mensaje: `Hoy es ${evento.nombre}. ${resumen}`,
            clave: `org-hoy-${evento.id}`,
          });
        }

        if (quedan > 0 && quedan <= POCAS) {
          this.crear("ORGANIZADOR", organizador.id, {
            tipo: "POCAS_ENTRADAS",
            titulo: "Tu evento se está agotando",
            mensaje: `A ${evento.nombre} le quedan solo ${quedan} entradas.`,
            clave: `org-pocas-${evento.id}`,
          });
        }

        if (dias <= 7 && vendidas === 0) {
          this.crear("ORGANIZADOR", organizador.id, {
            tipo: "SIN_VENTAS",
            titulo: "Todavía no vendiste entradas",
            mensaje: `${evento.nombre} es en ${dias === 0 ? "pocas horas" : dias + (dias === 1 ? " día" : " días")} y aún no tiene ventas.`,
            clave: `org-sin-ventas-${evento.id}`,
          });
        }
      });
  }

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
