class UsuarioRepository {
  constructor() {
    this.usuarios = [];
  }

  findAll() {
    return this.usuarios;
  }

  findById(id) {
    return this.usuarios.find(usuario => usuario.id === id);
  }

  save(usuario) {
    this.usuarios.push(usuario);
    return usuario;
  }
}

module.exports = UsuarioRepository;