const UsuarioRepository = require("./repositories/UsuarioRepository");
const EventoRepository = require("./repositories/EventoRepository");
const CompraRepository = require("./repositories/CompraRepository");
const OrganizadorRepository = require("./repositories/OrganizadorRepository");

const usuarioRepository = new UsuarioRepository();
const eventoRepository = new EventoRepository();
const compraRepository = new CompraRepository();
const organizadorRepository = new OrganizadorRepository();


module.exports = { usuarioRepository, eventoRepository, compraRepository, organizadorRepository };