const ForbiddenError = require("../errors/ForbiddenError");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

class CompraController {
  constructor(compraService) {
    this.compraService = compraService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.crear = this.crear.bind(this);
    this.cancelar = this.cancelar.bind(this);
    this.pagar = this.pagar.bind(this);
    this.obtenerMensajes = this.obtenerMensajes.bind(this);
    this.enviarMensaje = this.enviarMensaje.bind(this);
    this.exigirDuenio = this.exigirDuenio.bind(this);
    this.exigirParticipante = this.exigirParticipante.bind(this);
  }

  // Solo el comprador puede pagar o cancelar su compra.
  exigirDuenio(req) {
    const compra = this.compraService.obtenerPorId(req.params.id);
    if (!compra) throw new NotFoundError("Compra no encontrada");
    if (String(compra.comprador.id) !== String(req.usuario.id))
      throw new ForbiddenError("Esta compra no es tuya");
    return compra;
  }

  // Participan de una compra el comprador y el organizador del evento.
  exigirParticipante(req) {
    const compra = this.compraService.obtenerPorId(req.params.id);
    if (!compra) throw new NotFoundError("Compra no encontrada");

    const esComprador =
      req.rol === "COMPRADOR" && String(compra.comprador.id) === String(req.usuario.id);
    const esOrganizador =
      req.rol === "ORGANIZADOR" &&
      compra.evento.organizador &&
      String(compra.evento.organizador.id) === String(req.organizador.id);

    if (!esComprador && !esOrganizador)
      throw new ForbiddenError("No participás de esta compra");
    return compra;
  }

  obtenerTodos(req, res) {
    // El comprador ve sus compras; el organizador ve las de uno de sus eventos.
    if (req.rol === "COMPRADOR") {
      return res.json(this.compraService.obtenerPorUsuario(req.usuario.id));
    }

    if (!req.query.eventoId) throw new ValidationError("Indicá el eventoId");
    res.json(this.compraService.obtenerPorEvento(req.query.eventoId, req.organizador.id));
  }

  obtenerPorId(req, res) {
    res.json(this.exigirParticipante(req));
  }

  crear(req, res) {
    const compra = this.compraService.comprarEntrada({
      ...req.body,
      usuarioId: req.usuario.id,
    });
    res.status(201).json(compra);
  }

  cancelar(req, res) {
    this.exigirDuenio(req);
    res.json(this.compraService.cancelarCompra(req.params.id));
  }

  pagar(req, res) {
    this.exigirDuenio(req);
    res.json(this.compraService.pagarCompra(req.params.id));
  }

  obtenerMensajes(req, res) {
    this.exigirParticipante(req);
    res.json(this.compraService.obtenerMensajes(req.params.id));
  }

  enviarMensaje(req, res) {
    this.exigirParticipante(req);

    // El autor y su rol salen siempre del token, nunca del body.
    const autorId = req.rol === "COMPRADOR" ? req.usuario.id : req.organizador.id;
    const mensaje = this.compraService.enviarMensaje(req.params.id, {
      autorId,
      rol: req.rol,
      texto: req.body.texto,
    });
    res.status(201).json(mensaje);
  }
}

module.exports = CompraController;
