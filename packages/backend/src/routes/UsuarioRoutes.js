const express = require("express");
const UsuarioController = require("../controllers/UsuarioController");
const UsuarioRepository = require("../repositories/UsuarioRepository");
const UsuarioService = require("../services/UsuarioService");
const { usuarioRepository } = require("../container");

const usuarioService = new UsuarioService(usuarioRepository);
const controllers = new UsuarioController(usuarioService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);
router.get("/:id", controllers.obtenerPorId);
router.post("/", controllers.crear);
router.put("/:id", controllers.actualizar);
router.delete("/:id", controllers.eliminar);

module.exports = router;