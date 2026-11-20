const express = require("express");
const CompraController = require("../controllers/CompraController");
const CompraRepository = require("../repositories/CompraRepository");
const CompraService = require("../services/CompraService");
const TarjetaService = require("../services/TarjetaService");
const auth = require("../middlewares/auth");
const { compraRepository, usuarioRepository, eventoRepository, notificacionService } = require("../container");

const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository, notificacionService);
const controllers = new CompraController(compraService, new TarjetaService());

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