const Categoria = require("../models/Categoria");
const ValidationError = require("../errors/ValidationError");

// Para comparar nombres sin importar mayúsculas, tildes ni espacios de más.
const normalizar = (texto) =>
  String(texto)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

class CategoriaService {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  obtenerTodos() {
    return this.categoriaRepository.findAll();
  }

  // Un organizador puede agregar un tipo de evento nuevo si el que necesita no existe.
  crear({ nombre, descripcion } = {}) {
    if (typeof nombre !== "string" || nombre.trim() === "")
      throw new ValidationError("El nombre de la categoría es obligatorio");

    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (limpio.length < 2 || limpio.length > 30)
      throw new ValidationError("El nombre de la categoría debe tener entre 2 y 30 caracteres");

    if (descripcion !== undefined && typeof descripcion !== "string")
      throw new ValidationError("La descripción debe ser un texto");

    const repetida = this.categoriaRepository
      .findAll()
      .some((categoria) => normalizar(categoria.nombre) === normalizar(limpio));
    if (repetida) throw new ValidationError("Ya existe una categoría con ese nombre");

    return this.categoriaRepository.save(new Categoria(undefined, limpio, (descripcion ?? "").trim()));
  }
}

module.exports = CategoriaService;
