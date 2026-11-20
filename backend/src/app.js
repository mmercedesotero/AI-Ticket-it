const express = require("express");
const EventoRoutes = require("./routes/EventoRoutes");
const UsuarioRoutes = require("./routes/UsuarioRoutes");
const OrganizadorRoutes = require("./routes/OrganizadorRoutes");
const CompraRoutes = require("./routes/CompraRoutes");
const errorHandler = require("./middlewares/errorHandler");
const CategoriaRoutes = require("./routes/CategoriaRoutes");
const ReseniaRoutes = require("./routes/ReseniaRoutes");
const AuthRoutes = require("./routes/AuthRoutes");
const FavoritoRoutes = require("./routes/FavoritoRoutes");
const TarjetaRoutes = require("./routes/TarjetaRoutes");
const NotificacionRoutes = require("./routes/NotificacionRoutes");

const app = express();
app.use(express.json({ limit: "3mb" })); // las fotos de perfil viajan en base64

app.use("/auth", AuthRoutes);
app.use("/eventos", EventoRoutes);
app.use("/usuarios", UsuarioRoutes)
app.use("/organizadores", OrganizadorRoutes)
app.use("/compras", CompraRoutes)
app.use("/categorias", CategoriaRoutes)
app.use("/resenias", ReseniaRoutes)
app.use("/favoritos", FavoritoRoutes)
app.use("/tarjetas", TarjetaRoutes)
app.use("/notificaciones", NotificacionRoutes)

app.use(errorHandler);

module.exports = app;
