const UsuarioRepository = require("./repositories/UsuarioRepository");
const EventoRepository = require("./repositories/EventoRepository");
const CompraRepository = require("./repositories/CompraRepository");
const OrganizadorRepository = require("./repositories/OrganizadorRepository");
const CategoriaRepository = require("./repositories/CategoriaRepository");
const categoriaRepository = new CategoriaRepository();
const ReseniaRepository = require("./repositories/ReseniaRepository");
const reseniaRepository = new ReseniaRepository();

const usuarioRepository = new UsuarioRepository();
const eventoRepository = new EventoRepository();
const compraRepository = new CompraRepository();
const organizadorRepository = new OrganizadorRepository();

const NotificacionRepository = require("./repositories/NotificacionRepository");
const NotificacionService = require("./services/NotificacionService");
const notificacionService = new NotificacionService(new NotificacionRepository(), compraRepository);


module.exports = { usuarioRepository, eventoRepository, compraRepository, organizadorRepository, categoriaRepository, reseniaRepository, notificacionService };