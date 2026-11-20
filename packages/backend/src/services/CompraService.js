const Compra = require("../models/Compra");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");
const EstadoCompra = require("../models/EstadoCompra");
const Mensaje = require("../models/Mensaje");
const ForbiddenError = require("../errors/ForbiddenError");

const { HORAS_RESERVA, MS_POR_HORA, creadaEn } = require("../utils/reservas");
const { fotoPublica } = require("../utils/foto");

class CompraService {
  constructor(compraRepository, usuarioRepository, eventoRepository, notificacionService) {
    this.notificacionService = notificacionService;
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  obtenerTodos() {
    return this.compraRepository.findAll();
  }

  obtenerPorId(id) {
    return this.compraRepository.findById(id);
  }

  crear(datos = {}) {
    const compra = new Compra(
      undefined,
      datos.comprador,
      datos.evento,
      datos.tipoEntrada,
      datos.cantidad,
      datos.total
    );

    return this.compraRepository.save(compra);
  }

  actualizar(id, datos) {
    return this.compraRepository.update(id, datos);
  }

  eliminar(id) {
    return this.compraRepository.delete(id);
  }

  // Las notificaciones son opcionales (los seeds crean compras sin ellas).
  notificar(rol, destinatario, tipo, titulo, mensaje) {
    if (this.notificacionService && destinatario)
      this.notificacionService.crear(rol, destinatario.id, { tipo, titulo, mensaje });
  }

  comprarEntrada({ usuarioId, eventoId, entradaId, cantidad } = {}) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    const evento = this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    if (evento.yaSeRealizo()) throw new ValidationError("El evento ya se realizó");

    const entrada = evento.tiposEntrada.find(
      (tipo) => String(tipo.id) === String(entradaId)
    );
    if (!entrada) throw new NotFoundError("Entrada no encontrada");

    if (!Number.isInteger(cantidad) || cantidad <= 0)
      throw new ValidationError("La cantidad debe ser un entero mayor a 0");

    if (cantidad > entrada.cupoDisponible)
      throw new ValidationError("No hay cupo suficiente para esa cantidad");

    const total = entrada.precio * cantidad;

    const compra = new Compra(undefined, usuario, evento, entrada, cantidad, total);
    entrada.cupoDisponible -= cantidad;

    this.compraRepository.save(compra);

    this.notificar(
      "COMPRADOR",
      usuario,
      "COMPRA",
      "Compra realizada",
      `Reservaste ${cantidad} × ${entrada.nombre} para ${evento.nombre}. Pagá para confirmarlas.`
    );

    // Al organizador solo se le avisa cuando se agota el evento (no por cada compra).
    if (evento.tiposEntrada.every((tipo) => tipo.cupoDisponible === 0)) {
      this.notificar(
        "ORGANIZADOR",
        evento.organizador,
        "EVENTO_AGOTADO",
        "¡Evento agotado!",
        `Se vendieron todas las entradas de ${evento.nombre}.`
      );
    }

    return compra;
  }
  obtenerPorUsuario(usuarioId) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    return this.compraRepository
      .findAll()
      .filter((compra) => String(compra.comprador.id) === String(usuarioId))
      .map((compra) => ({
        ...compra,
        diasParaEvento:
          compra.estado === EstadoCompra.CONFIRMADA
            ? compra.diasParaElEvento()
            : null,
      }));
  }

  obtenerPorEvento(eventoId, organizadorId) {
    const evento = this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    if (!evento.organizador || String(evento.organizador.id) !== String(organizadorId))
      throw new ForbiddenError("Este evento no es tuyo");

    const compras = this.compraRepository
      .findAll()
      .filter((compra) => String(compra.evento.id) === String(eventoId))
      .map((compra) => ({
        id: compra.id,
        comprador: `${compra.comprador.nombre} ${compra.comprador.apellido}`,
        tipoEntrada: compra.tipoEntrada.nombre,
        cantidad: compra.cantidad,
        total: compra.total,
        estado: compra.estado,
      }));

    const entradasDisponibles = evento.tiposEntrada.map((tipo) => ({
      id: tipo.id,
      nombre: tipo.nombre,
      cupoDisponible: tipo.cupoDisponible,
    }));

    return {
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
      compras,
      entradasDisponibles,
    };
  }

    obtenerPorUsuario(usuarioId) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");

    if (this.notificacionService) this.notificacionService.procesarReservas(usuario);

    return this.compraRepository
      .findAll()
      .filter((compra) => String(compra.comprador.id) === String(usuarioId))
      .map((compra) => {
        const dias = compra.diasParaElEvento();

        return {
          ...compra,
          diasParaEvento:
            compra.estado === EstadoCompra.CONFIRMADA && dias >= 0 ? dias : null,
        };
      });
  }
    cancelarCompra(id) {
    const compra = this.compraRepository.findById(id);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (compra.estado === EstadoCompra.UTILIZADA)
      throw new ValidationError("No se puede cancelar una compra ya utilizada");

    if (
      compra.estado === EstadoCompra.CANCELADA ||
      compra.estado === EstadoCompra.REEMBOLSADA
    )
      throw new ValidationError("La compra ya fue cancelada");

    if (compra.diasParaElEvento() < 0)
      throw new ValidationError(
        "No se puede cancelar una compra de un evento que ya se realizó"
      );

    const fuePagada = compra.estado === EstadoCompra.CONFIRMADA;
    compra.actualizarEstado(
      fuePagada ? EstadoCompra.REEMBOLSADA : EstadoCompra.CANCELADA
    );
    compra.tipoEntrada.cupoDisponible += compra.cantidad;

    this.notificar(
      "COMPRADOR",
      compra.comprador,
      fuePagada ? "REEMBOLSO" : "CANCELACION",
      fuePagada ? "Reembolso en camino" : "Compra cancelada",
      fuePagada
        ? `Cancelaste tu compra de ${compra.evento.nombre} y te reembolsamos el pago.`
        : `Cancelaste tu compra de ${compra.evento.nombre}.`
    );

    return compra;
  }

  pagarCompra(id, tarjeta) {
    const compra = this.compraRepository.findById(id);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (compra.estado !== EstadoCompra.PENDIENTE_PAGO)
      throw new ValidationError("Solo se puede pagar una compra pendiente de pago");

    if ((Date.now() - creadaEn(compra)) / MS_POR_HORA >= HORAS_RESERVA) {
      if (this.notificacionService) this.notificacionService.procesarReservas(compra.comprador);
      throw new ValidationError("La reserva venció: tenés que volver a elegir tus entradas");
    }

    if (compra.evento.yaSeRealizo())
      throw new ValidationError(
        "No se puede pagar una compra de un evento que ya se realizó"
      );

    if (!tarjeta) throw new ValidationError("Elegí una tarjeta para pagar");

    // Simulación: las tarjetas que terminan en 0000 son rechazadas.
    if (tarjeta.ultimos4 === "0000") {
      this.notificar(
        "COMPRADOR",
        compra.comprador,
        "PAGO_RECHAZADO",
        "Pago rechazado",
        `No pudimos cobrar tu compra de ${compra.evento.nombre}: la tarjeta no tiene fondos suficientes.`
      );
      throw new ValidationError("Pago rechazado: la tarjeta no tiene fondos suficientes");
    }

    compra.actualizarEstado(EstadoCompra.CONFIRMADA);

    this.notificar(
      "COMPRADOR",
      compra.comprador,
      "PAGO_CONFIRMADO",
      "Pago confirmado",
      `Pagaste ${compra.cantidad} × ${compra.tipoEntrada.nombre} para ${compra.evento.nombre}. ¡Tus entradas están listas!`
    );

    return compra;
  }
  
  // Al abrir el chat, quien lo abre queda al día: sus mensajes pasan a "leídos" y también el aviso que tenía.
  obtenerMensajes(compraId, rol) {
    const compra = this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (rol === "COMPRADOR" || rol === "ORGANIZADOR") {
      const ultimo = compra.mensajes.at(-1);
      if (ultimo) compra.lecturas[rol] = ultimo.id;

      const persona = rol === "COMPRADOR" ? compra.comprador : compra.evento.organizador;
      if (this.notificacionService && persona)
        this.notificacionService.marcarMensajesLeidos(rol, persona.id, compra.id);
    }

    return compra.mensajes;
  }

  // Los chats de una persona: las compras que tienen mensajes, con el último y cuántos faltan leer.
  listarChats(rol, personaId) {
    return this.compraRepository
      .findAll()
      .filter((c) => c.mensajes.length > 0)
      .filter((c) =>
        rol === "COMPRADOR"
          ? String(c.comprador.id) === String(personaId)
          : c.evento.organizador && String(c.evento.organizador.id) === String(personaId)
      )
      .map((compra) => {
        const ultimo = compra.mensajes.at(-1);
        const leido = compra.lecturas[rol] ?? 0;
        const contraparte =
          rol === "COMPRADOR"
            ? { nombre: compra.evento.organizador?.nombre ?? "Organizador", foto: fotoPublica(compra.evento.organizador, "ORGANIZADOR"), esOrganizacion: true }
            : { nombre: `${compra.comprador.nombre} ${compra.comprador.apellido}`, foto: fotoPublica(compra.comprador, "COMPRADOR"), esOrganizacion: false };

        return {
          compraId: compra.id,
          evento: { id: compra.evento.id, nombre: compra.evento.nombre },
          contraparte,
          ultimoMensaje: { texto: ultimo.texto, autorRol: ultimo.autor.rol, fechaHora: ultimo.fechaHora },
          noLeidos: compra.mensajes.filter((m) => m.autor.rol !== rol && m.id > leido).length,
        };
      })
      .sort((a, b) => new Date(b.ultimoMensaje.fechaHora) - new Date(a.ultimoMensaje.fechaHora));
  }

  enviarMensaje(compraId, { autorId, rol, texto } = {}) {
    const compra = this.compraRepository.findById(compraId);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    if (typeof texto !== "string" || texto.trim() === "")
      throw new ValidationError("El mensaje no puede estar vacío");

    if (rol !== "COMPRADOR" && rol !== "ORGANIZADOR")
      throw new ValidationError("El rol debe ser COMPRADOR u ORGANIZADOR");

    const participante =
      rol === "COMPRADOR" ? compra.comprador : compra.evento.organizador;
    if (!participante || String(participante.id) !== String(autorId))
      throw new ForbiddenError("El autor no participa de esta compra");

    const nombre =
      rol === "COMPRADOR"
        ? `${participante.nombre} ${participante.apellido}`
        : participante.nombre;
    const autor = { id: participante.id, nombre, rol };

    const mensaje = new Mensaje(compra.mensajes.length + 1, autor, texto.trim());
    compra.mensajes.push(mensaje);
    // Quien escribe ya leyó todo lo anterior.
    compra.lecturas[rol] = mensaje.id;

    // Se le avisa a la otra persona.
    const destino = rol === "COMPRADOR" ? compra.evento.organizador : compra.comprador;
    if (this.notificacionService && destino) {
      this.notificacionService.avisarMensaje(rol === "COMPRADOR" ? "ORGANIZADOR" : "COMPRADOR", destino.id, {
        compraId: compra.id,
        remitente: nombre,
        evento: compra.evento.nombre,
        texto: mensaje.texto,
      });
    }

    return mensaje;
  }
}

module.exports = CompraService;
