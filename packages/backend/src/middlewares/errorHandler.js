function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "El cuerpo del pedido no es un JSON válido" });
  }

  if (!err.status) console.error(err);

  const status = err.status || 500;
  const mensaje = err.status ? err.message : "Error interno del servidor";

  res.status(status).json({ error: mensaje });
}

module.exports = errorHandler;
