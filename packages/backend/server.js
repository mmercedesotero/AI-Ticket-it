const express = require("express");

const app = require("./src/app");
const cargarSeeds = require("./src/seeds");

cargarSeeds();

app.listen(3000, () => {
  console.log("Servidor funcionando");
});
