const express = require("express");
const eventoRoutes = require("./routes/eventoRoutes");

const app = express();

app.use(express.json());

app.use("/eventos", eventoRoutes);

module.exports = app;