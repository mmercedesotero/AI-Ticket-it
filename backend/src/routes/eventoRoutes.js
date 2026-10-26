const express = require("express");
const EventoController = require("../controllers/EventoController");
const EventoRepository = require("../repositories/EventoRepository");
const EventoService = require("../services/EventoService");
const { eventoRepository } = require("../container");

const eventoService = new EventoService(eventoRepository);
const controllers = new EventoController(eventoService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);
router.get("/:id", controllers.obtenerPorId);
router.post("/", controllers.crear);
router.put("/:id", controllers.actualizar);
router.delete("/:id", controllers.eliminar);

module.exports = router;