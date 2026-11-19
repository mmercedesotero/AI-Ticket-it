class AuthController {
  constructor(authService) {
    this.authService = authService;

    this.registrar = this.registrar.bind(this);
    this.login = this.login.bind(this);
    this.perfil = this.perfil.bind(this);
    this.recuperar = this.recuperar.bind(this);
    this.restablecer = this.restablecer.bind(this);
  }

  registrar(req, res) {
    res.status(201).json(this.authService.registrar(req.body));
  }

  login(req, res) {
    res.json(this.authService.login(req.body));
  }

  perfil(req, res) {
    res.json({ rol: req.rol, usuario: req.usuario ?? req.organizador });
  }

  recuperar(req, res) {
    res.json(this.authService.solicitarRecuperacion(req.body));
  }

  restablecer(req, res) {
    res.json(this.authService.restablecerPassword(req.body));
  }
}

module.exports = AuthController;
