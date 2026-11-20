const app = require("./src/app");
const cargarSeeds = require("./src/seeds");
const { mensajeDeArranque } = require("./src/utils/red");

const PUERTO = 3000;

cargarSeeds();

app.listen(PUERTO, () => {
  console.log(mensajeDeArranque(PUERTO));
});
