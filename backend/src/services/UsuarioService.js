const Usuario = require("../models/Usuario");

class UsuarioService {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  obtenerTodos() {
    return this.usuarioRepository.findAll();
  }
    obtenerPorId(id) {
    return this.usuarioRepository.findById(id);
  }

  crear(datos = {}) {
    const usuario = new Usuario(undefined, datos.nombre, datos.apellido)

    return this.usuarioRepository.save(usuario);
  }

  actualizar(id, datos) {
    return this.usuarioRepository.update(id, datos);
  }

  eliminar(id) {
    return this.usuarioRepository.delete(id);
  }
}

module.exports = UsuarioService;
