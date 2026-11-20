const express = require("express");
const EventoController = require("../controllers/EventoController");
const EventoRepository = require("../repositories/EventoRepository");
const EventoService = require("../services/EventoService");
const auth = require("../middlewares/auth");
const { eventoRepository, reseniaRepository, categoriaRepository, organizadorRepository, notificacionService } = require("../container");

const eventoService = new EventoService(eventoRepository, reseniaRepository, categoriaRepository, organizadorRepository, notificacionService);
const controllers = new EventoController(eventoService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);
router.get("/:id/portada", controllers.portada);
router.get("/:id", controllers.obtenerPorId);
router.post("/", auth, auth.soloOrganizador, controllers.crear);
router.put("/:id", auth, auth.soloOrganizador, controllers.actualizar);
router.delete("/:id", auth, auth.soloOrganizador, controllers.eliminar);


module.exports = router;