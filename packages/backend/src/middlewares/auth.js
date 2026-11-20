const UnauthorizedError = require("../errors/UnauthorizedError");
const ForbiddenError = require("../errors/ForbiddenError");
const { verificarToken } = require("../utils/token");
const { usuarioRepository, organizadorRepository } = require("../container");

// Lee "Authorization: Bearer <token>" y deja en el request:
//   req.rol = "COMPRADOR" | "ORGANIZADOR"
//   req.usuario (si es comprador) o req.organizador (si es organizador)
function auth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");

  if (tipo !== "Bearer" || !token) throw new UnauthorizedError();

  let datos;
  try {
    datos = verificarToken(token);
  } catch {
    throw new UnauthorizedError("La sesión expiró o el token no es válido");
  }

  if (datos.rol === "ORGANIZADOR") {
    req.organizador = organizadorRepository.findById(datos.id);
    if (!req.organizador) throw new UnauthorizedError("La cuenta ya no existe");
  } else {
    req.usuario = usuarioRepository.findById(datos.id);
    if (!req.usuario) throw new UnauthorizedError("La cuenta ya no existe");
  }

  req.rol = datos.rol === "ORGANIZADOR" ? "ORGANIZADOR" : "COMPRADOR";
  next();
}

// Se usan después de auth para limitar una ruta a un solo rol.
const soloRol = (rol) => (req, res, next) => {
  if (req.rol !== rol)
    throw new ForbiddenError(
      rol === "COMPRADOR"
        ? "Solo los compradores pueden hacer esto"
        : "Solo los organizadores pueden hacer esto"
    );
  next();
};

auth.soloComprador = soloRol("COMPRADOR");
auth.soloOrganizador = soloRol("ORGANIZADOR");

module.exports = auth;
