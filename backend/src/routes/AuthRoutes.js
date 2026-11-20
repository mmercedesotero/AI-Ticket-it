const express = require("express");
const AuthController = require("../controllers/AuthController");
const AuthService = require("../services/AuthService");
const auth = require("../middlewares/auth");
const { usuarioRepository, organizadorRepository, compraRepository, eventoRepository } = require("../container");

const controllers = new AuthController(
  new AuthService(usuarioRepository, organizadorRepository, compraRepository, eventoRepository)
);

const router = express.Router();

router.post("/registro", controllers.registrar);
router.post("/login", controllers.login);
router.post("/recuperar", controllers.recuperar);
router.post("/restablecer", controllers.restablecer);
router.get("/perfil", auth, controllers.perfil);
router.put("/perfil", auth, controllers.actualizarPerfil);
router.put("/password", auth, controllers.cambiarPassword);
router.delete("/cuenta", auth, controllers.eliminarCuenta);

module.exports = router;
