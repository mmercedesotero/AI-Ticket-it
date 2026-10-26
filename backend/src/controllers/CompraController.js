class CompraController {
  constructor(compraService) {
    this.compraService = compraService;

    this.obtenerTodos = this.obtenerTodos.bind(this);
    this.obtenerPorId = this.obtenerPorId.bind(this);
    this.crear = this.crear.bind(this);
    this.actualizar = this.actualizar.bind(this);
    this.eliminar = this.eliminar.bind(this);
  }

  obtenerTodos(req, res) {
    res.json(this.compraService.obtenerTodos());
  }

  obtenerPorId(req, res) {
    const compra = this.compraService.obtenerPorId(req.params.id);

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    res.json(compra);
  }

  crear(req, res) {
    const compra = this.compraService.comprarEntrada(req.body);
    res.status(201).json(compra);
  }

  actualizar(req, res) {
    const compra = this.compraService.actualizar(req.params.id, req.body);

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    res.json(compra);
  }

  eliminar(req, res) {
    const eliminada = this.compraService.eliminar(req.params.id);

    if (!eliminada) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    res.status(204).end();
  }
}

module.exports = CompraController;
