const ValidationError = require("../errors/ValidationError");

const FORMATO = /^data:image\/(png|jpe?g|webp);base64,/;
const MAXIMO = 2500000; // caracteres del data URI (~1,8 MB)

// Las imágenes viajan como "data URI" (data:image/jpeg;base64,...). null o "" significa "sin imagen".
function validarImagen(valor, que = "La imagen") {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string" || !FORMATO.test(valor))
    throw new ValidationError(`${que} tiene que ser PNG, JPG o WEBP`);
  if (valor.length > MAXIMO) throw new ValidationError(`${que} es demasiado pesada`);
  return valor;
}

// Pasa un data URI a { tipo, datos } para poder devolverlo como imagen.
function decodificarImagen(dataUri) {
  const coincidencia = /^data:(image\/[a-z+.-]+);base64,(.*)$/s.exec(dataUri);
  return { tipo: coincidencia[1], datos: Buffer.from(coincidencia[2], "base64") };
}

module.exports = { validarImagen, decodificarImagen };
