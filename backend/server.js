const express = require("express");

const app = require("./src/app");
const cargarDatosIniciales = require("./src/datosIniciales");

cargarDatosIniciales();

app.listen(3000, () => {
  console.log("Servidor funcionando");
});
