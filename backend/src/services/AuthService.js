const Usuario = require("../models/Usuario");
const ValidationError = require("../errors/ValidationError");
const UnauthorizedError = require("../errors/UnauthorizedError");
const { hashPassword, verificarPassword } = require("../utils/password");
const { firmarToken } = require("../utils/token");

const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";
const emailValido = (valor) =>
  typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

class AuthService {
  constructor(usuarioRepository, organizadorRepository) {
    this.usuarioRepository = usuarioRepository;
    this.organizadorRepository = organizadorRepository;
  }

  // Solo los compradores se registran solos; los organizadores los da de alta el sistema.
  registrar({ nombre, apellido, email, password } = {}) {
    if (!textoValido(nombre)) throw new ValidationError("El nombre es obligatorio");
    if (!textoValido(apellido)) throw new ValidationError("El apellido es obligatorio");
    if (!emailValido(email)) throw new ValidationError("El email no es válido");
    if (typeof password !== "string" || password.length < 6)
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres");

    const emailLimpio = email.trim().toLowerCase();
    if (this.buscarCuenta(emailLimpio))
      throw new ValidationError("Ya existe una cuenta con ese email");

    const usuario = this.usuarioRepository.save(
      new Usuario(undefined, nombre.trim(), apellido.trim(), emailLimpio, hashPassword(password))
    );

    return { token: firmarToken(usuario.id, "COMPRADOR"), rol: "COMPRADOR", usuario };
  }

  login({ email, password } = {}) {
    if (!textoValido(email) || typeof password !== "string")
      throw new ValidationError("Email y contraseña son obligatorios");

    const cuenta = this.buscarCuenta(email.trim().toLowerCase());

    // Mismo mensaje para email inexistente y contraseña incorrecta: no revelamos cuál falló.
    if (!cuenta || !verificarPassword(password, cuenta.persona.passwordHash))
      throw new UnauthorizedError("Email o contraseña incorrectos");

    return {
      token: firmarToken(cuenta.persona.id, cuenta.rol),
      rol: cuenta.rol,
      usuario: cuenta.persona,
    };
  }

  // Busca el email entre compradores y organizadores.
  buscarCuenta(email) {
    const usuario = this.usuarioRepository.findAll().find((u) => u.email === email);
    if (usuario) return { rol: "COMPRADOR", persona: usuario };

    const organizador = this.organizadorRepository.findAll().find((o) => o.email === email);
    if (organizador) return { rol: "ORGANIZADOR", persona: organizador };

    return null;
  }
}

module.exports = AuthService;
