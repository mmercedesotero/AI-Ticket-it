const express = require("express");
const CategoriaController = require("../controllers/CategoriaController");
const CategoriaService = require("../services/CategoriaService");
const { categoriaRepository } = require("../container");

const categoriaService = new CategoriaService(categoriaRepository);
const controllers = new CategoriaController(categoriaService);

const router = express.Router();

router.get("/", controllers.obtenerTodos);

module.exports = router;