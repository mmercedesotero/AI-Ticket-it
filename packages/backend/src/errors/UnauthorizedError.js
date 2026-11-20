class UnauthorizedError extends Error {
  constructor(mensaje = "Necesitás iniciar sesión") {
    super(mensaje);
    this.status = 401;
  }
}

module.exports = UnauthorizedError;
