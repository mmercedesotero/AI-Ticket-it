class OrganizadorRepository {
  constructor() {
    this.organizadores = [];
  }

  findAll() {
    return this.organizadores;
  }

  findById(id) {
    return this.organizadores.find(
      (organizador) => String(organizador.id) === String(id)
    );
  }

  save(organizador) {
    if (organizador.id === undefined || organizador.id === null) {
      organizador.id =
        Math.max(0, ...this.organizadores.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.organizadores.push(organizador);
    return organizador;
  }

  update(id, datosActualizados) {
    const organizador = this.findById(id);

    if (!organizador) {
      return null;
    }

    Object.assign(organizador, datosActualizados);

    return organizador;
  }

  delete(id) {
    const indice = this.organizadores.findIndex(
      (organizador) => String(organizador.id) === String(id)
    );

    if (indice === -1) {
      return false;
    }

    this.organizadores.splice(indice, 1);

    return true;
  }
}

module.exports = OrganizadorRepository;
