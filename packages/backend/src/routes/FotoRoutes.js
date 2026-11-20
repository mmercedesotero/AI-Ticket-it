const express = require("express");
const { usuarioRepository, organizadorRepository } = require("../container");
const { decodificarImagen } = require("../utils/imagen");

const router = express.Router();

// Devuelve la foto de perfil guardada de un comprador o un organizador.
router.get("/:rol/:id", (req, res) => {
  const repositorio = req.params.rol === "ORGANIZADOR" ? organizadorRepository : usuarioRepository;
  const persona = repositorio.findById(req.params.id);

  if (!persona || !persona.foto) return res.status(404).json({ error: "Sin foto" });
  if (/^https?:\/\//.test(persona.foto)) return res.redirect(persona.foto);

  const { tipo, datos } = decodificarImagen(persona.foto);
  res.set("Content-Type", tipo);
  res.set("Cache-Control", "public, max-age=60");
  res.send(datos);
});

module.exports = router;
