const express = require("express");
const auth = require("../middlewares/auth");
const ReseniaController = require("../controllers/ReseniaController");
const ReseniaService = require("../services/ReseniaService");
const {
  reseniaRepository,
  compraRepository,
  organizadorRepository,
  notificacionService,
} = require("../container");

const reseniaService = new ReseniaService(
  reseniaRepository,
  compraRepository,
  organizadorRepository,
  notificacionService
);
const controllers = new ReseniaController(reseniaService);

const router = express.Router();

router.get("/", controllers.obtenerTodas);
router.post("/", auth, auth.soloComprador, controllers.crear);

module.exports = router;
