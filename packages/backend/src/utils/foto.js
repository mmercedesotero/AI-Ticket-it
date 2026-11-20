// La foto de una persona puede ser una URL o una imagen guardada (data URI). En las listas no se manda la imagen
// entera: se manda la URL, o una ruta (/fotos/ROL/ID) desde donde la app la pide.
function fotoPublica(persona, rol) {
  if (!persona || !persona.foto) return null;
  if (/^https?:\/\//.test(persona.foto)) return persona.foto;
  return `/fotos/${rol}/${persona.id}`;
}

module.exports = { fotoPublica };
