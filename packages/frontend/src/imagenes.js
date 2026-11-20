import { API } from "./api";

// Fotos de los eventos de prueba, buscadas por nombre del evento.
// En React Native cada imagen se carga con require() y la ruta tiene que estar escrita a mano.
const IMAGENES = {
  "Coldplay": require("../img/Coldplay.jpeg"),
  "Festival de Jazz": require("../img/Festival de Jazz.jpeg"),
  "Hamlet": require("../img/hamlet.jpeg"),
  "Lollapalooza": require("../img/lollapalooza.jpeg"),
  "Noche de Rock": require("../img/NochedeRock.jpeg"),
  "Cosquin Rock 2025": require("../img/cosquin rock.jpeg"),
  "Stand-Up Comedy": require("../img/images.jpeg"),
  "El Principito": require("../img/EL-PRINCIPITO.jpg"),
  "Cena Show de Tango": require("../img/cena de tango.jpeg"),
  "Cine Bajo las Estrellas": require("../img/cine bajo las estrellas.jpeg"),
  "Cuarteto en el Parque": require("../img/cuatero recital.jpeg"),
  "El Lago de los Cisnes": require("../img/el lago de los cisnes.jpeg"),
  "Electro Sunset": require("../img/electro sunset.jpeg"),
  "Jazz & Vino": require("../img/jazz and vino.jpg"),
  "La Casa de Bernarda Alba": require("../img/la casa de bernarda alba.jpeg"),
  "Noche de Monólogos": require("../img/noche de monologos.jpeg"),
  "Orquesta Sinfónica: Noche de Gala": require("../img/orquesta sinfonica noche gala.jpeg"),
  "Rock en el Río": require("../img/rock en el rio.jpeg"),
  "Noche de Tributo: Rock Nacional": require("../img/rock nacional.jpeg"),
  "Romeo y Julieta": require("../img/romeo y julieta.jpeg"),
  "Stand-Up Navideño": require("../img/stand up navideño.jpeg"),
  "Tango en Caminito": require("../img/tango en caminito.jpeg"),
  "Rock en Vinilo": require("../img/rock en vinilo.jpeg"),
  "Macbeth": require("../img/macbeth.jpeg"),
  "Gala de Ballet de Primavera": require("../img/ballet de primavera.jpeg"),
  "Especial Verano: Comedia en Vivo": require("../img/Especial Verano Comedia en Vivo.jpeg"),
  "Festival Ruido Blanco 2026": require("../img/ruido blanco.jpeg"),
};

// Si el evento no tiene foto (por ejemplo uno recién creado), devuelve null.
// Primero la foto local del evento de prueba; si no hay, la portada que subió el organizador (viene del servidor).
export const imagenDe = (evento) =>
  IMAGENES[evento.nombre] ?? (evento.portada ? { uri: `${API}${evento.portada}` } : null);
