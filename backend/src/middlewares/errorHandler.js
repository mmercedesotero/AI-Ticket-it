function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const mensaje = err.status ? err.message : "Error interno del servidor";

  res.status(status).json({ error: mensaje });
}

module.exports = errorHandler;
