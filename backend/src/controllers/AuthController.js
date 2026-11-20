class AuthController {
  constructor(authService) {
    this.authService = authService;

    this.registrar = this.registrar.bind(this);
    this.login = this.login.bind(this);
    this.perfil = this.perfil.bind(this);
    this.recuperar = this.recuperar.bind(this);
    this.restablecer = this.restablecer.bind(this);
    this.actualizarPerfil = this.actualizarPerfil.bind(this);
    this.cambiarPassword = this.cambiarPassword.bind(this);
    this.eliminarCuenta = this.eliminarCuenta.bind(this);
  }

  registrar(req, res) {
    res.status(201).json(this.authService.registrar(req.body));
  }

  login(req, res) {
    res.json(this.authService.login(req.body));
  }

  perfil(req, res) {
    res.json(this.authService.perfil(req.usuario ?? req.organizador, req.rol));
  }

  actualizarPerfil(req, res) {
    res.json(this.authService.actualizarPerfil(req.usuario ?? req.organizador, req.rol, req.body));
  }

  cambiarPassword(req, res) {
    res.json(this.authService.cambiarPassword(req.usuario ?? req.organizador, req.body));
  }

  eliminarCuenta(req, res) {
    res.json(this.authService.eliminarCuenta(req.usuario ?? req.organizador, req.rol, req.body));
  }

  recuperar(req, res) {
    res.json(this.authService.solicitarRecuperacion(req.body));
  }

  restablecer(req, res) {
    res.json(this.authService.restablecerPassword(req.body));
  }
}

module.exports = AuthController;
