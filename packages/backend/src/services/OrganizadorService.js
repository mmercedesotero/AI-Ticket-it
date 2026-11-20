const Organizador = require("../models/Organizador");
const ValidationError = require("../errors/ValidationError");
const pick = require("../utils/pick");

const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";

class OrganizadorService {
  constructor(organizadorRepository) {
    this.organizadorRepository = organizadorRepository;
  }

  obtenerTodos() {
    return this.organizadorRepository.findAll();
  }

  obtenerPorId(id) {
    return this.organizadorRepository.findById(id);
  }

  crear(datos = {}) {
    if (!textoValido(datos.nombre))
      throw new ValidationError("El nombre es obligatorio");

    const organizador = new Organizador(undefined, datos.nombre.trim());

    return this.organizadorRepository.save(organizador);
  }

  actualizar(id, datos) {
    const cambios = pick(datos, ["nombre"]);

    if (cambios.nombre !== undefined) {
      if (!textoValido(cambios.nombre))
        throw new ValidationError("El nombre no puede estar vacío");
      cambios.nombre = cambios.nombre.trim();
    }

    return this.organizadorRepository.update(id, cambios);
  }

  eliminar(id) {
    return this.organizadorRepository.delete(id);
  }
}

module.exports = OrganizadorService;
