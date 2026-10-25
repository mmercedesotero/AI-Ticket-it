class UsuarioService {
  constructor(UsuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  obtenerTodos() {
    return this.usuarioRepository.findAll();
  }
}