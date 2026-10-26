const Organizador = require("../models/Organizador");

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
    const organizador = new Organizador(undefined, datos.nombre);

    return this.organizadorRepository.save(organizador);
  }

  actualizar(id, datos) {
    return this.organizadorRepository.update(id, datos);
  }

  eliminar(id) {
    return this.organizadorRepository.delete(id);
  }
}

module.exports = OrganizadorService;
