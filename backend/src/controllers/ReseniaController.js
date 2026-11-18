class ReseniaController {
  constructor(reseniaService) {
    this.reseniaService = reseniaService;

    this.obtenerTodas = this.obtenerTodas.bind(this);
    this.crear = this.crear.bind(this);
  }

  obtenerTodas(req, res) {
    res.json(this.reseniaService.obtenerTodas(req.query));
  }

  crear(req, res) {
    const resenia = this.reseniaService.crear(req.body);
    res.status(201).json(resenia);
  }
}

module.exports = ReseniaController;
