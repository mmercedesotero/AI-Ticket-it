// Fotos de los eventos de prueba, buscadas por nombre del evento.
// En React Native cada imagen se carga con require() y la ruta tiene que estar escrita a mano.
const IMAGENES = {
  "Coldplay": require("../img/Coldplay.jpeg"),
  "Festival de Jazz": require("../img/Festival de Jazz.jpeg"),
  "Hamlet": require("../img/hamlet.jpeg"),
  "Lollapalooza": require("../img/lollapalooza.jpeg"),
  "Noche de Rock": require("../img/NochedeRock.jpeg"),
  "Cosquin Rock 2025": require("../img/cosquin rock.jpeg"),
};

// Si el evento no tiene foto (por ejemplo uno recién creado), devuelve null.
export const imagenDe = (evento) => IMAGENES[evento.nombre] ?? null;
