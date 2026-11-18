const jwt = require("jsonwebtoken");

// En un proyecto real esto va en una variable de entorno.
const SECRET = process.env.JWT_SECRET || "ai-ticket-it-secreto-de-desarrollo";

// El token guarda quién es y con qué rol entró (COMPRADOR u ORGANIZADOR).
const firmarToken = (id, rol) => jwt.sign({ id, rol }, SECRET, { expiresIn: "8h" });

const verificarToken = (token) => jwt.verify(token, SECRET);

module.exports = { firmarToken, verificarToken };
