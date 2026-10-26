const express = require("express");
const CompraController = require("../controllers/CompraController");
const CompraRepository = require("../repositories/CompraRepository");
const CompraService = require("../services/CompraService");
const { compraRepository, usuarioRepository, eventoRepository } = require("../container");

const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository);
const controllers = new CompraController(compraService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);
router.get("/:id", controllers.obtenerPorId);
router.post("/", controllers.crear);
router.put("/:id", controllers.actualizar);
router.delete("/:id", controllers.eliminar);

module.exports = router;