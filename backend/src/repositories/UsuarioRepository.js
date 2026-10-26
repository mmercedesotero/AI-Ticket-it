class UsuarioRepository {
  constructor() {
    this.usuarios = [];
  }

  findAll() {
    return this.usuarios;
  }

  findById(id) {
    return this.usuarios.find(usuario => String(usuario.id) === String(id));
  }

  save(usuario) {
    if (usuario.id === undefined || usuario.id === null) {
      usuario.id =
        Math.max(0, ...this.usuarios.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.usuarios.push(usuario);
    return usuario;
  }

    update(id, datosActualizados) {
    const usuario = this.findById(id);

    if (!usuario) {
        return null;
    }

    Object.assign(usuario, datosActualizados);

    return usuario;
    }
    delete(id) {
        const indice = this.usuarios.findIndex(
            usuario => String(usuario.id) === String(id)
        );

        if (indice === -1) {
            return false;
        }

        this.usuarios.splice(indice, 1);

        return true;
    }
}

module.exports = UsuarioRepository;