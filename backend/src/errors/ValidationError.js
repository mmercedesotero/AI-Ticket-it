class ValidationError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.status = 400;
  }
}

module.exports = ValidationError;
