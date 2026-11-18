class AuthController {
  constructor(authService) {
    this.authService = authService;

    this.registrar = this.registrar.bind(this);
    this.login = this.login.bind(this);
    this.perfil = this.perfil.bind(this);
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
}

module.exports = AuthController;
