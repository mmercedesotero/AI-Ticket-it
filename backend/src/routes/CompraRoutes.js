const express = require("express");
const CompraController = require("../controllers/CompraController");
const CompraRepository = require("../repositories/CompraRepository");
const CompraService = require("../services/CompraService");
const auth = require("../middlewares/auth");
const { compraRepository, usuarioRepository, eventoRepository } = require("../container");

const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository);
const controllers = new CompraController(compraService);

const router = express.Router();
router.use(auth);

router.get("/", controllers.obtenerTodos);
router.get("/:id", controllers.obtenerPorId);
router.post("/", auth.soloComprador, controllers.crear);
router.put("/:id/cancelar", auth.soloComprador, controllers.cancelar);
router.get("/:id/mensajes", controllers.obtenerMensajes);
router.post("/:id/mensajes", controllers.enviarMensaje);
router.put("/:id/pagar", auth.soloComprador, controllers.pagar);

module.exports = router;