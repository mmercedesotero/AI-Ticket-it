class FavoritoController {
  constructor(favoritoService) {
    this.favoritoService = favoritoService;

    this.obtener = this.obtener.bind(this);
    this.agregar = this.agregar.bind(this);
    this.quitar = this.quitar.bind(this);
  }

  obtener(req, res) {
    res.json(this.favoritoService.obtener(req.usuario));
  }

  agregar(req, res) {
    res.status(201).json(this.favoritoService.agregar(req.usuario, req.params.eventoId));
  }

  quitar(req, res) {
    res.json(this.favoritoService.quitar(req.usuario, req.params.eventoId));
  }
}

module.exports = FavoritoController;
