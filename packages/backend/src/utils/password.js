const crypto = require("crypto");

// Guarda "salt:hash". El salt hace que dos usuarios con la misma contraseña tengan hashes distintos.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verificarPassword(password, guardado) {
  if (typeof guardado !== "string") return false;

  const [salt, hash] = guardado.split(":");
  // Si el dato guardado no tiene el formato "salt:hash" no se puede verificar: es una contraseña incorrecta.
  if (!salt || !hash) return false;

  const intento = crypto.scryptSync(password, salt, 64);
  const esperado = Buffer.from(hash, "hex");

  return esperado.length === intento.length && crypto.timingSafeEqual(intento, esperado);
}

module.exports = { hashPassword, verificarPassword };
