class TarjetaController {
  constructor(tarjetaService) {
    this.tarjetaService = tarjetaService;

    this.obtener = this.obtener.bind(this);
    this.crear = this.crear.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtener(req, res) {
    res.json(this.tarjetaService.obtener(req.usuario));
  }

  crear(req, res) {
    res.status(201).json(this.tarjetaService.crear(req.usuario, req.body));
  }

  eliminar(req, res) {
    this.tarjetaService.eliminar(req.usuario, req.params.id);
    res.status(204).end();
  }
}

module.exports = TarjetaController;
