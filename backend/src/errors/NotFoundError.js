class NotFoundError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.status = 404;
  }
}

module.exports = NotFoundError;
