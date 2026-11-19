class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService;

    this.obtener = this.obtener.bind(this);
    this.marcarLeida = this.marcarLeida.bind(this);
    this.marcarTodasLeidas = this.marcarTodasLeidas.bind(this);
  }

  // Quién pregunta sale del token: un comprador o un organizador.
  destinatario(req) {
    return req.rol === "ORGANIZADOR" ? req.organizador.id : req.usuario.id;
  }

  obtener(req, res) {
    res.json(this.notificacionService.obtener(req.rol, this.destinatario(req)));
  }

  marcarLeida(req, res) {
    res.json(this.notificacionService.marcarLeida(req.rol, this.destinatario(req), req.params.id));
  }

  marcarTodasLeidas(req, res) {
    res.json(this.notificacionService.marcarTodasLeidas(req.rol, this.destinatario(req)));
  }
}

module.exports = NotificacionController;
