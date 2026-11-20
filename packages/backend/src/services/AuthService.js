const crypto = require("crypto");
const Usuario = require("../models/Usuario");
const Organizador = require("../models/Organizador");
const ValidationError = require("../errors/ValidationError");
const ForbiddenError = require("../errors/ForbiddenError");
const UnauthorizedError = require("../errors/UnauthorizedError");
const { hashPassword, verificarPassword } = require("../utils/password");
const { firmarToken } = require("../utils/token");

const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";
const emailValido = (valor) =>
  typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

const MINUTOS_DE_VALIDEZ = 10;
const MAXIMO_FOTO = 2500000; // caracteres del data URI (~1,8 MB)

class AuthService {
  constructor(usuarioRepository, organizadorRepository, compraRepository, eventoRepository) {
    this.usuarioRepository = usuarioRepository;
    this.organizadorRepository = organizadorRepository;
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
    // Códigos de recuperación pendientes: email -> { codigo, expira }.
    this.recuperaciones = new Map();
  }

  // Cualquiera puede crear una cuenta, como comprador o como organizador.
  // Comprador: nombre + apellido. Organizador: nombre (de la productora).
  registrar({ rol = "COMPRADOR", nombre, apellido, email, password, foto } = {}) {
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
    const fotoValida = this.validarFoto(foto);

    if (rol === "ORGANIZADOR") {
      const organizador = this.organizadorRepository.save(
        new Organizador(undefined, nombre.trim(), emailLimpio, hashPassword(password))
      );
      organizador.foto = fotoValida;
      return { token: firmarToken(organizador.id, "ORGANIZADOR"), rol, usuario: organizador.toPerfil() };
    }

    const usuario = this.usuarioRepository.save(
      new Usuario(undefined, nombre.trim(), apellido.trim(), emailLimpio, hashPassword(password))
    );

    usuario.foto = fotoValida;

    return { token: firmarToken(usuario.id, "COMPRADOR"), rol, usuario: usuario.toPerfil() };
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
      usuario: cuenta.persona.toPerfil(),
    };
  }

  // Datos completos de la cuenta que hizo la consulta.
  perfil(persona, rol) {
    return { rol, usuario: persona.toPerfil() };
  }

  // Edita los datos del perfil. Solo se cambian los campos que vienen en el pedido.
  actualizarPerfil(persona, rol, datos = {}) {
    const { nombre, apellido, telefono, ciudad, foto, pagoRapido } = datos;

    if (nombre !== undefined) {
      if (!textoValido(nombre))
        throw new ValidationError(rol === "ORGANIZADOR" ? "El nombre de la productora es obligatorio" : "El nombre es obligatorio");
      persona.nombre = nombre.trim();
    }

    if (apellido !== undefined && rol === "COMPRADOR") {
      if (!textoValido(apellido)) throw new ValidationError("El apellido es obligatorio");
      persona.apellido = apellido.trim();
    }

    if (telefono !== undefined) {
      const limpio = String(telefono).trim();
      if (limpio !== "" && !/^\+\d{1,3} \d{6,12}$/.test(limpio))
        throw new ValidationError("El teléfono no es válido (formato +54 1155551234)");
      persona.telefono = limpio;
    }

    if (ciudad !== undefined) {
      const limpia = String(ciudad).trim();
      if (limpia.length > 80) throw new ValidationError("La ciudad es demasiado larga");
      persona.ciudad = limpia;
    }

    if (foto !== undefined) persona.foto = this.validarFoto(foto);

    if (pagoRapido !== undefined && rol === "COMPRADOR") {
      if (typeof pagoRapido !== "boolean") throw new ValidationError("pagoRapido debe ser verdadero o falso");
      persona.pagoRapido = pagoRapido;
    }

    return { rol, usuario: persona.toPerfil() };
  }

  cambiarPassword(persona, { actual, nueva } = {}) {
    if (typeof actual !== "string" || !verificarPassword(actual, persona.passwordHash))
      throw new ValidationError("La contraseña actual no es correcta");
    this.validarPassword(nueva);
    if (actual === nueva) throw new ValidationError("La contraseña nueva tiene que ser distinta de la actual");

    persona.passwordHash = hashPassword(nueva);
    return { mensaje: "Tu contraseña se actualizó." };
  }

  // Borra la cuenta si no deja nada pendiente: compras activas (comprador) o eventos publicados (organizador).
  eliminarCuenta(persona, rol, { password } = {}) {
    if (typeof password !== "string" || !verificarPassword(password, persona.passwordHash))
      throw new ValidationError("La contraseña no es correcta");

    if (rol === "COMPRADOR") {
      const pendientes = this.compraRepository
        .findAll()
        .filter((c) => String(c.comprador?.id) === String(persona.id))
        .filter((c) => c.estado === "PENDIENTE_PAGO" || c.estado === "CONFIRMADA");
      if (pendientes.length > 0)
        throw new ForbiddenError("Tenés entradas activas: cancelalas o usalas antes de eliminar tu cuenta");
      this.usuarioRepository.delete(persona.id);
    } else {
      const eventos = this.eventoRepository
        .findAll()
        .filter((e) => String(e.organizador?.id) === String(persona.id));
      if (eventos.length > 0)
        throw new ForbiddenError("Tenés eventos publicados: no se puede eliminar la cuenta");
      this.organizadorRepository.delete(persona.id);
    }

    return { mensaje: "Tu cuenta fue eliminada." };
  }

  // La foto viaja como data URI (data:image/jpeg;base64,...). null o "" la quita.
  validarFoto(foto) {
    if (foto === undefined || foto === null || foto === "") return null;
    if (typeof foto !== "string" || !/^data:image\/(png|jpe?g|webp);base64,/.test(foto))
      throw new ValidationError("La foto tiene que ser una imagen PNG, JPG o WEBP");
    if (foto.length > MAXIMO_FOTO) throw new ValidationError("La foto es demasiado pesada");
    return foto;
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
