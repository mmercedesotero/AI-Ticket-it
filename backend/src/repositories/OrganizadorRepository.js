class OrganizadorRepository {
  constructor() {
    this.organizadores = [];
  }

  findAll() {
    return this.organizadores;
  }

  findById(id) {
    return this.organizadores.find(organizador => organizador.id === id);
  }

  save(organizador) {
    this.organizadores.push(organizador);
    return organizador;
  }
}

module.exports = OrganizadorRepository;