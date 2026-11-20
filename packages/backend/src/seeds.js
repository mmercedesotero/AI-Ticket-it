const Usuario = require("./models/Usuario");
const Organizador = require("./models/Organizador");
const Categoria = require("./models/Categoria");
const Evento = require("./models/Evento");
const Entrada = require("./models/Entrada");
const EstadoCompra = require("./models/EstadoCompra");
const CompraService = require("./services/CompraService");
const TarjetaService = require("./services/TarjetaService");
const ReseniaService = require("./services/ReseniaService");
const { usuarioRepository, eventoRepository, organizadorRepository, compraRepository, categoriaRepository, reseniaRepository, notificacionService } = require("./container");
const { hashPassword } = require("./utils/password");

// Fecha de hoy +/- N días en formato AAAA-MM-DD (así los datos de prueba siempre quedan "cerca" de hoy).
const fechaEn = (dias) => {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};

// Fotos de perfil de ejemplo (retratos de prueba de randomuser.me).
const foto = (genero, numero) => `https://randomuser.me/api/portraits/${genero}/${numero}.jpg`;

function cargarDatos() {
  // Todas las cuentas de prueba (compradores y organizadores) tienen la contraseña "123456".
  const clave = hashPassword("123456");
  const tarjetaService = new TarjetaService();

  // ---------- Compradores ----------
  const crearUsuario = ([nombre, apellido, email, genero, numeroFoto, telefono, ciudad]) => {
    const usuario = usuarioRepository.save(new Usuario(undefined, nombre, apellido, email, clave));
    usuario.foto = foto(genero, numeroFoto);
    usuario.telefono = telefono;
    usuario.ciudad = ciudad;
    return usuario;
  };

  const [ana, mer, tomas, lucia, mateo, valentina, joaquin, sofia, benjamin, camila, santiago, julieta, franco] = [
    ["Ana", "Perez", "ana@mail.com", "women", 44, "+54 1155551234", "Buenos Aires, Argentina"],
    ["Mer", "Perez", "mer@mail.com", "women", 65, "+54 1144447788", "Buenos Aires, Argentina"],
    ["Tomas", "Gomez", "tomas@mail.com", "men", 32, "+54 3515551020", "Córdoba, Argentina"],
    ["Lucía", "Fernández", "lucia@mail.com", "women", 12, "+54 2615553344", "Mendoza, Argentina"],
    ["Mateo", "Rodríguez", "mateo@mail.com", "men", 75, "+54 3415557788", "Rosario, Argentina"],
    ["Valentina", "López", "valentina@mail.com", "women", 26, "+54 1166663322", "La Plata, Argentina"],
    ["Joaquín", "Martínez", "joaquin@mail.com", "men", 18, "+598 94123456", "Montevideo, Uruguay"],
    ["Sofía", "Díaz", "sofia@mail.com", "women", 90, "+54 2235551199", "Mar del Plata, Argentina"],
    ["Benjamín", "Sosa", "benjamin@mail.com", "men", 51, "+54 3814556677", "Tucumán, Argentina"],
    ["Camila", "Romero", "camila@mail.com", "women", 33, "+56 912345678", "Santiago, Chile"],
    ["Santiago", "Álvarez", "santiago@mail.com", "men", 7, "+54 1133332211", "Buenos Aires, Argentina"],
    ["Julieta", "Torres", "julieta@mail.com", "women", 57, "+54 2995552244", "Neuquén, Argentina"],
    ["Franco", "Ruiz", "franco@mail.com", "men", 63, "+54 3624556600", "Resistencia, Argentina"],
  ].map(crearUsuario);

  // Tarjetas guardadas. La de Tomas terminada en 0000 sirve para probar un pago rechazado.
  const guardarTarjeta = (usuario, numero, vencimiento) =>
    tarjetaService.crear(usuario, { numero, titular: `${usuario.nombre} ${usuario.apellido}`.toUpperCase(), vencimiento, cvv: "123" });

  guardarTarjeta(ana, "4242424242424242", "12/29");
  guardarTarjeta(ana, "5555555555554444", "08/28");
  guardarTarjeta(mer, "4111111111111111", "05/29");
  guardarTarjeta(tomas, "4000000000000000", "11/30"); // termina en 0000: el pago se rechaza
  guardarTarjeta(tomas, "5105105105105100", "03/29");
  guardarTarjeta(lucia, "4012888888881881", "09/28");
  guardarTarjeta(mateo, "5555555555554445", "01/29");
  guardarTarjeta(valentina, "4242424242421111", "07/30");
  guardarTarjeta(joaquin, "4929251897047956", "10/28");
  guardarTarjeta(sofia, "5200828282828210", "02/29");
  guardarTarjeta(benjamin, "4532015112830366", "06/29");
  guardarTarjeta(camila, "5425233430109903", "12/28");
  guardarTarjeta(santiago, "4716108999716531", "04/30");
  guardarTarjeta(julieta, "5454545454545454", "09/29");
  guardarTarjeta(franco, "4485275742308327", "08/29");
  mateo.pagoRapido = false; // para mostrar las dos preferencias

  // ---------- Categorías ----------
  const recital = categoriaRepository.save(new Categoria(undefined, "Recital", "Música en vivo"));
  const teatro = categoriaRepository.save(new Categoria(undefined, "Teatro", "Obras y espectáculos"));
  const festival = categoriaRepository.save(new Categoria(undefined, "Festival", "Festivales de varios días"));
  const humor = categoriaRepository.save(new Categoria(undefined, "Humor", "Stand-up y comedia en vivo"));
  const danza = categoriaRepository.save(new Categoria(undefined, "Danza", "Ballet, tango y danza contemporánea"));

  // ---------- Organizadores ----------
  const crearOrganizador = (nombre, email, genero, numeroFoto, telefono, ciudad) => {
    const org = organizadorRepository.save(new Organizador(undefined, nombre, email, clave));
    org.foto = null; // las organizaciones usan un logo (sus iniciales), no la foto de una persona
    org.telefono = telefono;
    org.ciudad = ciudad;
    return org;
  };
  const liveNation = crearOrganizador("Live Nation", "live@mail.com", "men", 22, "+54 1140001111", "Buenos Aires, Argentina");
  const teatroBA = crearOrganizador("Teatro BA", "teatro@mail.com", "women", 68, "+54 1140002222", "Buenos Aires, Argentina");
  const ruidoBlanco = crearOrganizador("Ruido Blanco Producciones", "ruido@mail.com", "men", 41, "+54 3514003333", "Córdoba, Argentina");
  const comediaClub = crearOrganizador("Comedia Club", "comedia@mail.com", "women", 15, "+54 1140004444", "Buenos Aires, Argentina");
  const festivalesSur = crearOrganizador("Festivales del Sur", "sur@mail.com", "men", 85, "+54 2614005555", "Mendoza, Argentina");
  const salaMayor = crearOrganizador("Sala Mayor", "sala@mail.com", "women", 79, "+54 3414006666", "Rosario, Argentina");

  // ---------- Eventos ----------
  // dias: cuántos días desde hoy (negativo = ya pasó; se ajusta al final, después de las compras).
  const definiciones = [
    // --- Los de siempre ---
    { id: "coldplay", nombre: "Coldplay", fecha: "2027-01-10", categoria: recital, organizador: liveNation,
      descripcion: "La gira mundial de Coldplay llega con un espectáculo de luces, pulseras LED y todos sus clásicos, de Yellow a Viva la Vida. Una noche pensada para cantar de principio a fin.",
      entradas: [["General", 80000, "Campo", 100], ["VIP", 200000, "Palco", 20]] },
    { id: "jazz", nombre: "Festival de Jazz", fecha: "2027-03-20", categoria: festival, organizador: liveNation,
      descripcion: "Dos jornadas de jazz en vivo con músicos de Buenos Aires, Nueva Orleans y Montevideo. Escenario principal al aire libre, patio gastronómico y jam sessions hasta la madrugada.",
      entradas: [["General", 15000, "Campo", 200], ["VIP", 45000, "Palco", 30]] },
    { id: "hamlet", nombre: "Hamlet", fecha: "2026-12-05", categoria: teatro, organizador: teatroBA,
      descripcion: "El clásico de Shakespeare en una versión contemporánea con una puesta minimalista y actuaciones intensas. Ser o no ser: una obra que sigue interpelando cuatro siglos después.",
      entradas: [["Platea", 35000, "Sala", 80], ["Pullman", 25000, "Balcón", 60]] },
    { id: "lolla", nombre: "Lollapalooza", fecha: "2027-03-26", categoria: festival, organizador: liveNation,
      descripcion: "Tres días de música con más de cincuenta artistas en cuatro escenarios, food trucks, arte y experiencias de marca. El festival más grande del año llega al hipódromo.",
      entradas: [["Día 1", 120000, "Campo", 500], ["Pase 3 días", 300000, "Campo", 100]] },
    { id: "nocheRock", nombre: "Noche de Rock", fecha: "2027-06-01", categoria: recital, organizador: teatroBA,
      descripcion: "Una noche con las mejores bandas de rock nacional en vivo: guitarras, buen sonido y mucha energía en el campo.",
      entradas: [["General", 20000, "Campo", 150]] },
    { id: "cosquin", nombre: "Cosquin Rock 2025", fecha: "2027-02-15", categoria: festival, organizador: liveNation,
      descripcion: "El festival de rock más tradicional del país en las sierras de Córdoba: dos días de música, camping y encuentro entre generaciones.",
      entradas: [["General", 50000, "Campo", 300]] },
    { id: "standUp", nombre: "Stand-Up Comedy", fecha: fechaEn(1), categoria: humor, organizador: teatroBA,
      descripcion: "Una noche de humor con los mejores comediantes del circuito porteño: monólogos, improvisación y mucha risa garantizada. Ideal para ir en grupo.",
      entradas: [["General", 12000, "Platea", 80], ["VIP", 25000, "Primera fila", 20]] },

    // --- Próximos ---
    { id: "infantil", nombre: "El Principito", fecha: fechaEn(8), categoria: teatro, organizador: teatroBA,
      descripcion: "La obra para toda la familia basada en el libro de Saint-Exupéry, con títeres, música en vivo y un planeta que cambia de lugar en cada escena. Recomendada desde los 5 años.",
      entradas: [["Platea", 12000, "Sala", 120], ["Pullman", 9000, "Balcón", 80]] },
    { id: "monologos", nombre: "Noche de Monólogos", fecha: fechaEn(6), categoria: humor, organizador: comediaClub,
      descripcion: "Seis comediantes, seis estilos y una sola regla: que no pare la risa. Se pide algo para tomar y se disfruta desde la mesa, en formato de bar.",
      entradas: [["General", 9000, "Mesa compartida", 60], ["Mesa VIP", 18000, "Mesa para 4", 16]] },
    { id: "jazzVino", nombre: "Jazz & Vino", fecha: fechaEn(1), categoria: recital, organizador: liveNation,
      descripcion: "Cuarteto de jazz en vivo en una bodega boutique, con degustación de tres vinos de autor. Cupos muy reducidos para disfrutar en un ambiente íntimo.",
      entradas: [["Mesa", 25000, "Mesa con degustación", 12], ["Barra", 15000, "Barra", 14]] },
    { id: "tributo", nombre: "Noche de Tributo: Rock Nacional", fecha: fechaEn(9), categoria: recital, organizador: ruidoBlanco,
      descripcion: "Las mejores bandas tributo recorren los grandes clásicos del rock argentino de los 80 y 90. Todos los temas que sabés de memoria, en un solo escenario.",
      entradas: [["General", 18000, "Campo", 250], ["Platea", 28000, "Platea", 80]] },
    { id: "tango", nombre: "Tango en Caminito", fecha: fechaEn(14), categoria: danza, organizador: salaMayor,
      descripcion: "Orquesta típica en vivo, bailarines campeones y los tangos más queridos en una función de gala. Una experiencia muy porteña para locales y turistas.",
      entradas: [["Platea", 22000, "Sala", 90], ["Palco", 38000, "Palco", 24]] },
    { id: "romeo", nombre: "Romeo y Julieta", fecha: fechaEn(18), categoria: teatro, organizador: teatroBA,
      descripcion: "El amor más famoso del teatro, con una puesta moderna, vestuario atemporal y combates coreografiados. Un elenco joven que le da frescura a la tragedia.",
      entradas: [["Platea", 32000, "Sala", 70], ["Pullman", 22000, "Balcón", 50]] },
    { id: "cuarteto", nombre: "Cuarteto en el Parque", fecha: fechaEn(21), categoria: recital, organizador: festivalesSur,
      descripcion: "Una tarde-noche de cuarteto con las voces más populares del género, patio de comidas y baile libre bajo las estrellas.",
      entradas: [["General", 14000, "Campo", 400], ["VIP", 32000, "Sector VIP", 60]] },
    { id: "electro", nombre: "Electro Sunset", fecha: fechaEn(27), categoria: festival, organizador: ruidoBlanco,
      descripcion: "Música electrónica desde el atardecer hasta el amanecer frente al río: DJs internacionales, visuales inmersivos y una pista que no para.",
      entradas: [["Early Bird", 35000, "Campo", 30], ["General", 55000, "Campo", 400], ["VIP", 120000, "Zona VIP", 40]] },
    { id: "cisnes", nombre: "El Lago de los Cisnes", fecha: fechaEn(32), categoria: danza, organizador: salaMayor,
      descripcion: "El ballet más célebre de Tchaikovsky interpretado por un cuerpo de baile de más de cuarenta bailarines y orquesta en vivo. Una función imperdible para toda la familia.",
      entradas: [["Platea", 40000, "Sala", 100], ["Pullman", 30000, "Balcón", 70], ["Paraíso", 18000, "Galería", 90]] },
    { id: "navideno", nombre: "Stand-Up Navideño", fecha: fechaEn(36), categoria: humor, organizador: comediaClub,
      descripcion: "El especial de fin de año con los chistes que no se pueden contar en la cena familiar. Brindis de cortesía para todo el público.",
      entradas: [["General", 11000, "Platea", 90], ["Primera fila", 20000, "Primera fila", 12]] },
    { id: "cine", nombre: "Cine Bajo las Estrellas", fecha: fechaEn(40), categoria: festival, organizador: festivalesSur,
      descripcion: "Tres noches de cine independiente al aire libre, con reposeras, pochoclo artesanal y charlas con los directores después de cada función.",
      entradas: [["Pase libre", 8000, "Terraza", 300], ["Pase 3 noches", 20000, "Terraza", 120]] },
    { id: "bernarda", nombre: "La Casa de Bernarda Alba", fecha: fechaEn(45), categoria: teatro, organizador: salaMayor,
      descripcion: "El drama de Federico García Lorca sobre el encierro y el deseo, con un elenco íntegramente femenino y una dirección que apuesta a la tensión.",
      entradas: [["Platea", 28000, "Sala", 80], ["Balcón", 20000, "Balcón", 60]] },
    { id: "sinfonica", nombre: "Orquesta Sinfónica: Noche de Gala", fecha: fechaEn(60), categoria: recital, organizador: salaMayor,
      descripcion: "Un programa con las obras más queridas de Beethoven y Dvořák, dirigido por un maestro invitado. Vestimenta elegante sugerida.",
      entradas: [["Platea", 30000, "Sala", 120], ["Pullman", 21000, "Balcón", 90]] },
    { id: "rockRio", nombre: "Rock en el Río", fecha: fechaEn(75), categoria: festival, organizador: liveNation,
      descripcion: "Dos días de rock internacional y nacional a orillas del río, con escenarios gemelos y zona de camping para quienes vienen de lejos.",
      entradas: [["Día 1", 60000, "Campo", 300], ["Pase 2 días", 100000, "Campo", 200], ["Camping", 25000, "Zona de acampe", 80]] },
    { id: "cenaTango", nombre: "Cena Show de Tango", fecha: fechaEn(0), categoria: danza, organizador: salaMayor,
      descripcion: "Cena de tres pasos con show de tango en vivo en un salón histórico. Pocas mesas, ambiente íntimo y espectáculo de primer nivel.",
      entradas: [["Mesa para 2", 60000, "Salón principal", 6]] },

    // --- Ya realizados (se mueven al pasado al final, para poder tener entradas utilizadas y reseñas) ---
    { id: "pRuido", nombre: "Festival Ruido Blanco 2026", fecha: fechaEn(20), categoria: festival, organizador: ruidoBlanco, pasado: -40,
      descripcion: "La edición 2026 del festival independiente más querido de Córdoba: treinta bandas, tres escenarios y mucha música emergente.",
      entradas: [["General", 22000, "Campo", 400]] },
    { id: "pBallet", nombre: "Gala de Ballet de Primavera", fecha: fechaEn(20), categoria: danza, organizador: salaMayor, pasado: -25,
      descripcion: "Una gala con fragmentos de los grandes clásicos, bailarines invitados del exterior y un cierre con todo el elenco.",
      entradas: [["Platea", 26000, "Sala", 120]] },
    { id: "pComedia", nombre: "Especial Verano: Comedia en Vivo", fecha: fechaEn(20), categoria: humor, organizador: comediaClub, pasado: -18,
      descripcion: "El especial de verano de Comedia Club con invitados sorpresa y un show de improvisación con participación del público.",
      entradas: [["General", 9500, "Platea", 100]] },
    { id: "pMacbeth", nombre: "Macbeth", fecha: fechaEn(20), categoria: teatro, organizador: teatroBA, pasado: -33,
      descripcion: "La tragedia escocesa de ambición y culpa, con una escenografía de espejos y un elenco que sostiene la tensión durante toda la función.",
      entradas: [["Platea", 30000, "Sala", 90]] },
    { id: "pVinilo", nombre: "Rock en Vinilo", fecha: fechaEn(20), categoria: recital, organizador: liveNation, pasado: -12,
      descripcion: "Una noche para escuchar discos clásicos completos, tocados por una banda en vivo y proyectados con arte original.",
      entradas: [["General", 17000, "Campo", 200]] },
    { id: "pMusica", nombre: "Fiesta de la Música", fecha: fechaEn(20), categoria: festival, organizador: festivalesSur, pasado: -90,
      descripcion: "Una jornada de bandas locales en plazas y escenarios abiertos, con feria de discos y comida callejera.",
      entradas: [["Pase único", 6000, "Plaza central", 300]] },
  ];

  const eventosPorId = {};
  const pasados = [];
  definiciones.forEach((datos) => {
    const tiposEntrada = datos.entradas.map(
      ([nombre, precio, ubicacion, cupo], i) => new Entrada(i + 1, nombre, precio, ubicacion, cupo)
    );
    const evento = eventoRepository.save(
      new Evento(undefined, datos.nombre, datos.fecha, datos.descripcion, datos.categoria, tiposEntrada, [], datos.organizador)
    );
    datos.organizador.eventos.push(evento);
    eventosPorId[datos.id] = evento;
    if (datos.pasado !== undefined) pasados.push([evento, datos.pasado]);
  });
  const e = eventosPorId;

  // ---------- Favoritos ----------
  const favoritos = (usuario, ...claves) => claves.forEach((c) => usuario.favoritos.push(e[c].id));
  favoritos(ana, "coldplay", "jazz", "jazzVino", "lolla", "tango", "electro");
  favoritos(mer, "hamlet", "romeo", "cisnes");
  favoritos(tomas, "tributo", "cuarteto", "rockRio");
  favoritos(lucia, "monologos", "navideno", "standUp");
  favoritos(mateo, "electro", "lolla", "coldplay");
  favoritos(valentina, "cisnes", "tango", "sinfonica", "bernarda");
  favoritos(joaquin, "jazz", "rockRio", "cine");
  favoritos(sofia, "infantil", "cine", "jazzVino");
  favoritos(santiago, "coldplay", "tributo", "electro", "rockRio");

  // ---------- Compras ----------
  const compraService = new CompraService(compraRepository, usuarioRepository, eventoRepository, notificacionService);
  const reseniaService = new ReseniaService(reseniaRepository, compraRepository, organizadorRepository, notificacionService);

  let reservas = 0;
  const comprar = (usuario, evento, entradaId, cantidad, estado) => {
    const compra = compraService.comprarEntrada({
      usuarioId: usuario.id, eventoId: evento.id, entradaId, cantidad,
    });
    if (estado === EstadoCompra.CANCELADA) {
      compra.actualizarEstado(EstadoCompra.CONFIRMADA);
      compraService.cancelarCompra(compra.id);
    } else {
      // Una entrada utilizada primero estuvo confirmada.
      if (estado === EstadoCompra.UTILIZADA) compra.actualizarEstado(EstadoCompra.CONFIRMADA);
      if (estado) compra.actualizarEstado(estado);
    }

    // Fechas del historial: las compras ya utilizadas son más viejas que las demás.
    if (!estado) {
      // Reserva sin pagar: se hizo hace pocas horas (entre 2 y 18), para que algunas ya tengan el aviso de abonar.
      reservas += 1;
      const horas = 2 + ((reservas * 5) % 17);
      compra.historial[0].fechaHora = new Date(Date.now() - horas * 60 * 60 * 1000);
    } else {
      const base = estado === EstadoCompra.UTILIZADA ? 12 : 3;
      compra.historial.forEach((cambio, i) => {
        cambio.fechaHora = new Date(Date.now() - Math.max(base - i, 0) * 24 * 60 * 60 * 1000);
      });
    }
    return compra;
  };
  const { CONFIRMADA, UTILIZADA, CANCELADA } = EstadoCompra;

  // Compras ya utilizadas + reseñas de los eventos que ya pasaron.
  const resenar = (usuario, evento, entradaId, cantidad, puntuacion, detalle) => {
    const compra = comprar(usuario, evento, entradaId, cantidad, UTILIZADA);
    reseniaService.crear({ usuarioId: usuario.id, compraId: compra.id, puntuacion, detalle });
    return compra;
  };

  // Los de siempre (Noche de Rock y Cosquín).
  const compraTomas = comprar(tomas, e.nocheRock, 1, 2, UTILIZADA);
  comprar(ana, e.cosquin, 1, 2, UTILIZADA);
  const compraMer = comprar(mer, e.cosquin, 1, 1, UTILIZADA);
  reseniaService.crear({ usuarioId: mer.id, compraId: compraMer.id, puntuacion: 4, detalle: "Muy buen festival" });
  reseniaService.crear({ usuarioId: tomas.id, compraId: compraTomas.id, puntuacion: 3, detalle: "El sonido podía mejorar" });
  comprar(tomas, e.nocheRock, 1, 2, UTILIZADA);
  comprar(mer, e.nocheRock, 1, 1, CONFIRMADA);
  resenar(lucia, e.cosquin, 1, 2, 5, "Una experiencia increíble, volvería sin dudarlo. La organización impecable.");
  resenar(santiago, e.cosquin, 1, 1, 5, "Las bandas estuvieron a otro nivel y el predio es hermoso.");
  resenar(camila, e.nocheRock, 1, 2, 4, "Gran noche de rock. Solo mejoraría las barras, había mucha fila.");

  // Eventos pasados con varias reseñas (para tener puntajes y promedios distintos).
  resenar(ana, e.pRuido, 1, 2, 5, "Descubrí un montón de bandas nuevas. El mejor festival independiente al que fui.");
  resenar(mateo, e.pRuido, 1, 1, 4, "Muy buena grilla. El sonido del escenario 2 estaba un poco bajo.");
  resenar(valentina, e.pRuido, 1, 3, 5, "Fuimos con amigas y lo disfrutamos de principio a fin. ¡Ya compramos para el año que viene!");
  resenar(joaquin, e.pRuido, 1, 2, 3, "Linda propuesta pero la salida fue un caos, tardamos más de una hora en irnos.");
  resenar(sofia, e.pRuido, 1, 1, 4, "Buen clima, buena comida y buena música.");

  resenar(mer, e.pBallet, 1, 2, 5, "Emocionante de principio a fin. Los bailarines invitados fueron un lujo.");
  resenar(valentina, e.pBallet, 1, 2, 5, "Preciosa función, la orquesta en vivo hizo toda la diferencia.");
  resenar(julieta, e.pBallet, 1, 1, 4, "Hermosa gala. Los asientos del fondo tienen poca visibilidad.");

  resenar(lucia, e.pComedia, 1, 4, 5, "Nos reímos hasta llorar. El invitado sorpresa fue lo mejor.");
  resenar(franco, e.pComedia, 1, 2, 4, "Muy divertido, algunos chistes se repetían pero el balance es excelente.");
  resenar(tomas, e.pComedia, 1, 2, 3, "Estuvo bien, esperaba un poco más del cierre.");
  resenar(benjamin, e.pComedia, 1, 3, 5, "Lo mejor de comedia que vi este año. Totalmente recomendable.");

  resenar(mer, e.pMacbeth, 1, 2, 4, "Una puesta muy fuerte. El actor principal está soberbio.");
  resenar(ana, e.pMacbeth, 1, 1, 5, "La escenografía de espejos es una genialidad. Salí sin palabras.");
  resenar(camila, e.pMacbeth, 1, 2, 2, "Me pareció confusa y demasiado larga, aunque las actuaciones son buenas.");

  resenar(santiago, e.pVinilo, 1, 2, 5, "Escuchar discos enteros en vivo es una idea genial. Pura nostalgia.");
  resenar(mateo, e.pVinilo, 1, 2, 4, "Muy buen show, el repertorio fue impecable.");
  resenar(tomas, e.pVinilo, 1, 1, 4, "Gran sonido y excelente banda. Volvería.");

  resenar(julieta, e.pMusica, 1, 2, 3, "Buena idea y mucha gente, pero faltaron lugares para sentarse.");
  resenar(franco, e.pMusica, 1, 1, 4, "Ambiente hermoso, mucha música local de calidad.");
  resenar(benjamin, e.pMusica, 1, 2, 5, "Un plan perfecto para toda la tarde. ¡Que se repita!");

  // Entradas de eventos próximos: confirmadas, pendientes y alguna cancelada.
  comprar(ana, e.coldplay, 1, 2, CONFIRMADA);
  comprar(mer, e.coldplay, 1, 1);
  comprar(ana, e.jazz, 2, 1, CONFIRMADA);
  comprar(mer, e.hamlet, 1, 2, CONFIRMADA);
  const compraStandUp = comprar(ana, e.standUp, 1, 2, CONFIRMADA);
  comprar(lucia, e.standUp, 1, 3, CONFIRMADA);

  const compraTango = comprar(ana, e.tango, 1, 2, CONFIRMADA);
  comprar(ana, e.electro, 2, 1);
  comprar(mateo, e.electro, 3, 2, CONFIRMADA);
  comprar(santiago, e.electro, 2, 4, CONFIRMADA);
  comprar(valentina, e.cisnes, 1, 2, CONFIRMADA);
  comprar(valentina, e.tango, 2, 1);
  comprar(julieta, e.romeo, 1, 2, CONFIRMADA);
  comprar(sofia, e.infantil, 1, 3, CONFIRMADA);
  comprar(sofia, e.infantil, 2, 2);
  comprar(joaquin, e.jazz, 1, 2, CONFIRMADA);
  comprar(joaquin, e.rockRio, 2, 1, CONFIRMADA);
  comprar(benjamin, e.cuarteto, 1, 4, CONFIRMADA);
  comprar(tomas, e.tributo, 1, 2, CONFIRMADA);
  comprar(tomas, e.cuarteto, 2, 1);
  comprar(camila, e.sinfonica, 1, 2, CONFIRMADA);
  comprar(franco, e.monologos, 1, 3, CONFIRMADA);
  comprar(lucia, e.monologos, 2, 1, CONFIRMADA);
  comprar(lucia, e.navideno, 1, 2);
  comprar(mer, e.bernarda, 1, 2, CANCELADA);
  comprar(santiago, e.lolla, 1, 2, CANCELADA);
  comprar(mateo, e.coldplay, 1, 2, CONFIRMADA);
  comprar(santiago, e.coldplay, 2, 1, CONFIRMADA);

  // Eventos casi agotados / agotados (para ver "Agotándose" y las notificaciones del organizador).
  comprar(lucia, e.jazzVino, 1, 4, CONFIRMADA);
  comprar(mateo, e.jazzVino, 1, 3, CONFIRMADA);
  comprar(valentina, e.jazzVino, 1, 3, CONFIRMADA); // quedan 2 mesas
  comprar(santiago, e.electro, 1, 20, CONFIRMADA);
  comprar(julieta, e.electro, 1, 7, CONFIRMADA); // quedan 3 Early Bird
  comprar(sofia, e.cenaTango, 1, 3, CONFIRMADA);
  comprar(camila, e.cenaTango, 1, 3, CONFIRMADA); // agotado

  // Conversaciones de ejemplo entre comprador y organizador.
  const chatear = (compra, comprador, organizador, mensajes) =>
    mensajes.forEach(([quien, texto]) => {
      if (quien === "C") compraService.enviarMensaje(compra.id, { autorId: comprador.id, rol: "COMPRADOR", texto });
      else compraService.enviarMensaje(compra.id, { autorId: organizador.id, rol: "ORGANIZADOR", texto });
    });
  chatear(compraStandUp, ana, teatroBA, [
    ["C", "Hola! ¿A qué hora abren las puertas?"],
    ["O", "¡Hola Ana! Las puertas abren a las 20:00 y el show empieza a las 21:30."],
    ["C", "Perfecto, ¿puedo entrar con el código QR desde el celular?"],
    ["O", "Sí, alcanza con mostrar el QR desde la app. ¡Nos vemos mañana!"],
  ]);
  chatear(compraTango, ana, salaMayor, [
    ["C", "Buenas tardes, ¿hay guardarropas en la sala?"],
    ["O", "Hola, sí, hay guardarropas sin costo en el hall de entrada."],
  ]);

  // Todos los eventos "ya realizados" se mueven al pasado ahora que ya tienen sus compras.
  pasados.forEach(([evento, dias]) => {
    evento.fecha = fechaEn(dias);
  });
  e.nocheRock.fecha = "2025-06-01";
  e.cosquin.fecha = "2025-02-15";

  // ---------- Notificaciones ----------
  // Las compras de arriba ya generaron avisos; se reparten en el tiempo y algunos quedan leídos.
  notificacionService.crear("COMPRADOR", ana.id, {
    tipo: "EVENTO_PUBLICADO",
    titulo: "Nuevo evento que te puede gustar",
    mensaje: "Se publicó Electro Sunset. ¡Ya hay entradas Early Bird disponibles!",
  });
  notificacionService.crear("COMPRADOR", mer.id, {
    tipo: "EVENTO_PUBLICADO",
    titulo: "Nuevo evento que te puede gustar",
    mensaje: "Se publicó El Lago de los Cisnes, una función de gala con orquesta en vivo.",
  });

  const lista = notificacionService.notificacionRepository.notificaciones;
  // Se descartan los avisos de compra de los eventos que ya pasaron (quedan solo las reseñas).
  const nombresPasados = [...pasados.map(([evento]) => evento.nombre), e.nocheRock.nombre, e.cosquin.nombre];
  for (let i = lista.length - 1; i >= 0; i--) {
    if (lista[i].tipo !== "RESENIA" && nombresPasados.some((nombre) => lista[i].mensaje.includes(nombre))) lista.splice(i, 1);
  }
  lista.forEach((n, i) => {
    const dias = (i * 7) % 13; // 0 a 12 días atrás, bien repartido
    const horas = (i * 5) % 20;
    n.fechaHora = new Date(Date.now() - (dias * 24 + horas) * 60 * 60 * 1000);
    // Las más viejas ya se leyeron; las de hoy y de los últimos días quedan sin leer.
    n.leida = dias >= 5 || i % 4 === 0;
  });
}

module.exports = cargarDatos;
