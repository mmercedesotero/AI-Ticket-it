const express = require("express");
const FavoritoController = require("../controllers/FavoritoController");
const FavoritoService = require("../services/FavoritoService");
const auth = require("../middlewares/auth");
const { eventoRepository } = require("../container");

const controllers = new FavoritoController(new FavoritoService(eventoRepository));

const router = express.Router();

// Solo los compradores tienen favoritos.
router.use(auth, auth.soloComprador);

router.get("/", controllers.obtener);
router.post("/:eventoId", controllers.agregar);
router.delete("/:eventoId", controllers.quitar);

module.exports = router;
