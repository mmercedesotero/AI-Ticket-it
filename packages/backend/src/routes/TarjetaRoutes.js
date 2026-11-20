const express = require("express");
const TarjetaController = require("../controllers/TarjetaController");
const TarjetaService = require("../services/TarjetaService");
const auth = require("../middlewares/auth");

const controllers = new TarjetaController(new TarjetaService());

const router = express.Router();

// Solo los compradores tienen tarjetas.
router.use(auth, auth.soloComprador);

router.get("/", controllers.obtener);
router.post("/", controllers.crear);
router.delete("/:id", controllers.eliminar);

module.exports = router;
