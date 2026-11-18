const express = require("express");
const AuthController = require("../controllers/AuthController");
const AuthService = require("../services/AuthService");
const auth = require("../middlewares/auth");
const { usuarioRepository, organizadorRepository } = require("../container");

const controllers = new AuthController(
  new AuthService(usuarioRepository, organizadorRepository)
);

const router = express.Router();

router.post("/registro", controllers.registrar);
router.post("/login", controllers.login);
router.get("/perfil", auth, controllers.perfil);

module.exports = router;
