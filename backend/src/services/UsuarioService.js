const Usuario = require("../models/Usuario");
const ValidationError = require("../errors/ValidationError");
const pick = require("../utils/pick");

const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";

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
    if (!textoValido(datos.nombre))
      throw new ValidationError("El nombre es obligatorio");
    if (!textoValido(datos.apellido))
      throw new ValidationError("El apellido es obligatorio");

    const usuario = new Usuario(
      undefined,
      datos.nombre.trim(),
      datos.apellido.trim()
    );

    return this.usuarioRepository.save(usuario);
  }

  actualizar(id, datos) {
    const cambios = pick(datos, ["nombre", "apellido"]);

    for (const campo of Object.keys(cambios)) {
      if (!textoValido(cambios[campo]))
        throw new ValidationError(`El campo ${campo} no puede estar vacío`);
      cambios[campo] = cambios[campo].trim();
    }

    return this.usuarioRepository.update(id, cambios);
  }

  eliminar(id) {
    return this.usuarioRepository.delete(id);
  }
}

module.exports = UsuarioService;
