const NotFoundError = require("../errors/NotFoundError");

// Los favoritos de un comprador se guardan como una lista de ids de eventos en usuario.favoritos.
class FavoritoService {
  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  obtener(usuario) {
    // Si un evento se borró, simplemente deja de aparecer.
    return usuario.favoritos
      .map((id) => this.eventoRepository.findById(id))
      .filter(Boolean);
  }

  agregar(usuario, eventoId) {
    const evento = this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError("Evento no encontrado");

    if (!usuario.favoritos.includes(evento.id)) usuario.favoritos.push(evento.id);

    return this.obtener(usuario);
  }

  quitar(usuario, eventoId) {
    usuario.favoritos = usuario.favoritos.filter((id) => String(id) !== String(eventoId));

    return this.obtener(usuario);
  }
}

module.exports = FavoritoService;
