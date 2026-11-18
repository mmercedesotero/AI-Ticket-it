const express = require("express");
const EventoRoutes = require("./routes/EventoRoutes");
const UsuarioRoutes = require("./routes/UsuarioRoutes");
const OrganizadorRoutes = require("./routes/OrganizadorRoutes");
const CompraRoutes = require("./routes/CompraRoutes");
const errorHandler = require("./middlewares/errorHandler");
const CategoriaRoutes = require("./routes/CategoriaRoutes");
const ReseniaRoutes = require("./routes/ReseniaRoutes");

const app = express();
app.use(express.json());

app.use("/eventos", EventoRoutes);
app.use("/usuarios", UsuarioRoutes)
app.use("/organizadores", OrganizadorRoutes)
app.use("/compras", CompraRoutes)
app.use("/categorias", CategoriaRoutes)
app.use("/resenias", ReseniaRoutes)

app.use(errorHandler);

module.exports = app;
