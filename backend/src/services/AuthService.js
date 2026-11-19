const crypto = require("crypto");
const Usuario = require("../models/Usuario");
const Organizador = require("../models/Organizador");
const ValidationError = require("../errors/ValidationError");
const UnauthorizedError = require("../errors/UnauthorizedError");
const { hashPassword, verificarPassword } = require("../utils/password");
const { firmarToken } = require("../utils/token");

const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";
const emailValido = (valor) =>
  typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

const MINUTOS_DE_VALIDEZ = 10;

class AuthService {
  constructor(usuarioRepository, organizadorRepository) {
    this.usuarioRepository = usuarioRepository;
    this.organizadorRepository = organizadorRepository;
    // Códigos de recuperación pendientes: email -> { codigo, expira }.
    this.recuperaciones = new Map();
  }

  // Cualquiera puede crear una cuenta, como comprador o como organizador.
  // Comprador: nombre + apellido. Organizador: nombre (de la productora).
  registrar({ rol = "COMPRADOR", nombre, apellido, email, password } = {}) {
    if (rol !== "COMPRADOR" && rol !== "ORGANIZADOR")
      throw new ValidationError("El rol debe ser COMPRADOR u ORGANIZADOR");

    if (!textoValido(nombre))
      throw new ValidationError(rol === "ORGANIZADOR" ? "El nombre de la productora es obligatorio" : "El nombre es obligatorio");
    if (rol === "COMPRADOR" && !textoValido(apellido))
      throw new ValidationError("El apellido es obligatorio");
    if (!emailValido(email)) throw new ValidationError("El email no es válido");
    this.validarPassword(password);

    const emailLimpio = email.trim().toLowerCase();
    if (this.buscarCuenta(emailLimpio))
      throw new ValidationError("Ya existe una cuenta con ese email");

    if (rol === "ORGANIZADOR") {
      const organizador = this.organizadorRepository.save(
        new Organizador(undefined, nombre.trim(), emailLimpio, hashPassword(password))
      );
      return { token: firmarToken(organizador.id, "ORGANIZADOR"), rol, usuario: organizador };
    }

    const usuario = this.usuarioRepository.save(
      new Usuario(undefined, nombre.trim(), apellido.trim(), emailLimpio, hashPassword(password))
    );

    return { token: firmarToken(usuario.id, "COMPRADOR"), rol, usuario };
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

  // Paso 1 de "Olvidé mi contraseña": se genera un código de 6 dígitos y se "envía" por email.
  // Es una simulación: como no hay servicio de email, el código se muestra en la consola del servidor
  // y se devuelve en la respuesta (campo codigoSimulado) para poder probarlo.
  solicitarRecuperacion({ email } = {}) {
    if (!emailValido(email)) throw new ValidationError("El email no es válido");

    const emailLimpio = email.trim().toLowerCase();
    const respuesta = { mensaje: "Si el email está registrado, te enviamos un código para recuperar tu contraseña." };

    // Si el email no existe respondemos igual, para no revelar qué cuentas existen.
    if (!this.buscarCuenta(emailLimpio)) return respuesta;

    const codigo = String(crypto.randomInt(100000, 1000000));
    this.recuperaciones.set(emailLimpio, {
      codigo,
      expira: Date.now() + MINUTOS_DE_VALIDEZ * 60 * 1000,
    });

    console.log(`[Email simulado] Código de recuperación para ${emailLimpio}: ${codigo}`);

    return { ...respuesta, codigoSimulado: codigo };
  }

  // Paso 2: con el código correcto se puede elegir una contraseña nueva.
  restablecerPassword({ email, codigo, password } = {}) {
    if (!emailValido(email)) throw new ValidationError("El email no es válido");
    this.validarPassword(password);

    const emailLimpio = email.trim().toLowerCase();
    const pendiente = this.recuperaciones.get(emailLimpio);

    if (!pendiente || pendiente.codigo !== String(codigo) || pendiente.expira < Date.now())
      throw new ValidationError("El código es incorrecto o ya venció");

    const cuenta = this.buscarCuenta(emailLimpio);
    cuenta.persona.passwordHash = hashPassword(password);
    this.recuperaciones.delete(emailLimpio);

    return { mensaje: "Tu contraseña se actualizó. Ya podés iniciar sesión." };
  }

  validarPassword(password) {
    if (typeof password !== "string" || password.length < 6)
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres");
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
