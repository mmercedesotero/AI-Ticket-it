class ForbiddenError extends Error {
  constructor(mensaje = "No tenés permiso para hacer esto") {
    super(mensaje);
    this.status = 403;
  }
}

module.exports = ForbiddenError;
