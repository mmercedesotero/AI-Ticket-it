const express = require("express");
const OrganizadorController = require("../controllers/OrganizadorController");
const OrganizadorService = require("../services/OrganizadorService");
const { organizadorRepository } = require("../container");

const organizadorService = new OrganizadorService(organizadorRepository);
const controllers = new OrganizadorController(organizadorService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);
router.get("/:id", controllers.obtenerPorId);
router.post("/", controllers.crear);
router.put("/:id", controllers.actualizar);
router.delete("/:id", controllers.eliminar);

module.exports = router;