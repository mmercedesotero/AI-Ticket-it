const express = require("express");
const NotificacionController = require("../controllers/NotificacionController");
const auth = require("../middlewares/auth");
const { notificacionService } = require("../container");

const controllers = new NotificacionController(notificacionService);

const router = express.Router();
router.use(auth);

router.get("/", controllers.obtener);
router.put("/leidas", controllers.marcarTodasLeidas);
router.put("/:id/leida", controllers.marcarLeida);

module.exports = router;
