const express = require("express");
const ReseniaController = require("../controllers/ReseniaController");
const ReseniaService = require("../services/ReseniaService");
const {
  reseniaRepository,
  compraRepository,
  organizadorRepository,
} = require("../container");

const reseniaService = new ReseniaService(
  reseniaRepository,
  compraRepository,
  organizadorRepository
);
const controllers = new ReseniaController(reseniaService);

const router = express.Router();

router.get("/", controllers.obtenerTodas);
router.post("/", controllers.crear);

module.exports = router;
