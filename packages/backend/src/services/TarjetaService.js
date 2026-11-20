const crypto = require("crypto");
const Tarjeta = require("../models/Tarjeta");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

const marcaDe = (numero) => {
  if (numero.startsWith("4")) return "Visa";
  if (numero.startsWith("5")) return "Mastercard";
  return "Tarjeta";
};

const MAXIMO_TARJETAS = 5;

// Las tarjetas de cada comprador se guardan en usuario.tarjetas.
class TarjetaService {
  obtener(usuario) {
    return usuario.tarjetas;
  }

  crear(usuario, { numero, titular, vencimiento, cvv } = {}) {
    const digitos = typeof numero === "string" ? numero.replace(/\s/g, "") : "";
    if (!/^\d{16}$/.test(digitos))
      throw new ValidationError("El número de tarjeta debe tener 16 dígitos");

    if (typeof titular !== "string" || titular.trim() === "")
      throw new ValidationError("El nombre del titular es obligatorio");

    const partes = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento ?? "");
    if (!partes) throw new ValidationError("El vencimiento debe tener formato MM/AA");

    // Una tarjeta vale hasta el último día del mes de vencimiento.
    const hoy = new Date();
    const vence = new Date(2000 + Number(partes[2]), Number(partes[1]), 0, 23, 59, 59);
    if (vence < hoy) throw new ValidationError("La tarjeta está vencida");

    if (!/^\d{3,4}$/.test(cvv ?? ""))
      throw new ValidationError("El código de seguridad debe tener 3 o 4 dígitos");

    // Misma tarjeta (mismo número) no se puede guardar dos veces.
    const huella = crypto.createHash("sha256").update(digitos).digest("hex");
    if (usuario.tarjetas.some((t) => t.huella === huella))
      throw new ValidationError("Esa tarjeta ya está guardada");

    if (usuario.tarjetas.length >= MAXIMO_TARJETAS)
      throw new ValidationError(`Podés guardar hasta ${MAXIMO_TARJETAS} tarjetas`);

    const id = Math.max(0, ...usuario.tarjetas.map((t) => t.id)) + 1;
    const tarjeta = new Tarjeta(id, marcaDe(digitos), digitos.slice(-4), vencimiento, titular.trim(), huella);
    usuario.tarjetas.push(tarjeta);

    return tarjeta;
  }

  eliminar(usuario, id) {
    const tarjeta = this.obtenerDelUsuario(usuario, id);
    usuario.tarjetas = usuario.tarjetas.filter((t) => t.id !== tarjeta.id);
  }

  obtenerDelUsuario(usuario, id) {
    if (id === undefined || id === null) throw new ValidationError("Elegí una tarjeta para pagar");

    const tarjeta = usuario.tarjetas.find((t) => String(t.id) === String(id));
    if (!tarjeta) throw new NotFoundError("Tarjeta no encontrada");

    return tarjeta;
  }
}

module.exports = TarjetaService;
