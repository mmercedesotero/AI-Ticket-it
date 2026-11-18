const crypto = require("crypto");

// Guarda "salt:hash". El salt hace que dos usuarios con la misma contraseña tengan hashes distintos.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verificarPassword(password, guardado) {
  if (!guardado) return false;

  const [salt, hash] = guardado.split(":");
  const intento = crypto.scryptSync(password, salt, 64);

  return crypto.timingSafeEqual(intento, Buffer.from(hash, "hex"));
}

module.exports = { hashPassword, verificarPassword };
