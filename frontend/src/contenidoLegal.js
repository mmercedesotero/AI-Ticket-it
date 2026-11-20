// Textos de "Términos y condiciones" y de "Ayuda y soporte".
// Ticket It es una app de práctica (trabajo práctico): los textos lo aclaran donde corresponde.

export const ACTUALIZACION_TERMINOS = "Noviembre 2026";

export const INTRO_TERMINOS =
  "Por favor, leé atentamente estos términos antes de utilizar Ticket It. Al usar la aplicación aceptás lo que se detalla a continuación.";

export const TERMINOS = [
  {
    titulo: "1. Aceptación de los términos",
    texto:
      "Al registrarte y comprar entradas, aceptás cumplir con estas condiciones de uso, las políticas de privacidad y la normativa de venta vigente. Si no estás de acuerdo con alguna de ellas, no podés usar la aplicación.",
  },
  {
    titulo: "2. Compra de entradas y pagos",
    texto:
      "Toda compra es definitiva una vez confirmado el pago. Los precios incluyen las tarifas de servicio. El procesamiento de pagos se realiza mediante plataformas autorizadas. En esta versión de práctica los pagos son simulados y no se cobra ningún dinero real.",
  },
  {
    titulo: "3. Política de devoluciones y reembolsos",
    texto:
      "Los reembolsos solo aplican en caso de cancelación o reprogramación del evento por parte del organizador, conforme a la ley vigente. Si cancelás una compra antes de pagarla no se genera ningún cargo.",
  },
  {
    titulo: "4. Uso de entradas y código QR",
    texto:
      "Cada entrada cuenta con un código QR único e intransferible para el ingreso al recinto. Compartir o publicar tu código puede permitir que otra persona use tu entrada: cuidalo como un dato personal.",
  },
  {
    titulo: "5. Responsabilidad del organizador",
    texto:
      "Ticket It actúa como intermediario de venta. La producción y realización del evento es responsabilidad del organizador, que define fecha, lugar, cupos y precios.",
  },
  {
    titulo: "6. Cuenta y seguridad",
    texto:
      "Sos responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta. Podés editar tus datos o eliminar tu cuenta desde tu perfil, siempre que no tengas entradas activas ni eventos publicados.",
  },
  {
    titulo: "7. Reseñas y conducta",
    texto:
      "Podés puntuar y comentar un evento solo después de haber asistido. No se permiten contenidos ofensivos, falsos o que vulneren derechos de terceros; podemos quitarlos sin previo aviso.",
  },
  {
    titulo: "8. Datos personales",
    texto:
      "Usamos tus datos (nombre, correo, teléfono, ciudad y foto) únicamente para el funcionamiento de la aplicación. No los compartimos con terceros. En esta versión de práctica la información no se guarda de forma permanente.",
  },
];

export const POLITICA_PRIVACIDAD =
  "Recopilamos solo los datos necesarios para crear tu cuenta, procesar tus compras y avisarte sobre tus eventos. Podés modificarlos o eliminarlos desde Perfil > Editar perfil. Nunca guardamos el número completo ni el código de seguridad de tus tarjetas: solo los últimos cuatro dígitos.";

// Categorías de la pantalla de ayuda.
export const CATEGORIAS_AYUDA = [
  { clave: "entradas", titulo: "Mis entradas", detalle: "QR, transferencias, accesos", icono: "ticket-outline" },
  { clave: "pagos", titulo: "Pagos y reembolsos", detalle: "Facturación, devoluciones", icono: "card-outline" },
  { clave: "organizador", titulo: "Modo organizador", detalle: "Crear eventos, ventas", icono: "megaphone-outline" },
  { clave: "todas", titulo: "Preguntas frecuentes", detalle: "Dudas generales, cuenta", icono: "help-circle-outline" },
];

export const PREGUNTAS = [
  {
    categoria: "entradas",
    pregunta: "¿Cómo descargo mi entrada QR?",
    respuesta:
      "Entrá a Mis compras y tocá la entrada: ahí ves tu código QR. También podés tocar \"Descargar comprobante\" para guardar un PDF con el ticket.",
  },
  {
    categoria: "entradas",
    pregunta: "¿Qué pasa si se cancela un evento?",
    respuesta:
      "Si el organizador cancela el evento, tus entradas pasan a estado reembolsado y te avisamos con una notificación.",
  },
  {
    categoria: "entradas",
    pregunta: "¿Puedo transferir mi entrada a un amigo?",
    respuesta:
      "Todavía no: cada entrada es personal. Por ahora, tu amigo tiene que comprar la suya desde su propia cuenta.",
  },
  {
    categoria: "entradas",
    pregunta: "Compré una entrada y quedó \"Pendiente de pago\"",
    respuesta:
      "Tus entradas quedan reservadas hasta que las pagues. Entrá a Mis compras, tocá la entrada y elegí \"Pagar\" para confirmarla.",
  },
  {
    categoria: "pagos",
    pregunta: "¿Qué medios de pago puedo usar?",
    respuesta:
      "Podés guardar hasta 5 tarjetas en Perfil > Mis métodos de pago. En esta versión de práctica los pagos son simulados: una tarjeta terminada en 0000 se rechaza para probar el error.",
  },
  {
    categoria: "pagos",
    pregunta: "¿Cómo pido un reembolso?",
    respuesta:
      "Si cancelás una compra confirmada se genera el reembolso automáticamente y recibís un aviso. Los eventos cancelados por el organizador también se reembolsan.",
  },
  {
    categoria: "pagos",
    pregunta: "¿Qué es \"Guardar datos de pago rápido\"?",
    respuesta:
      "Es una preferencia de tu perfil: cuando está activa, al pagar se elige automáticamente tu primera tarjeta guardada.",
  },
  {
    categoria: "organizador",
    pregunta: "¿Cómo creo un evento?",
    respuesta:
      "Ingresá con una cuenta de organizador y tocá \"Crear evento\" en Mis eventos. Completá nombre, fecha, categoría y los tipos de entrada con su precio y cupo.",
  },
  {
    categoria: "organizador",
    pregunta: "¿Dónde veo cuántas entradas vendí?",
    respuesta:
      "En Mis eventos tocá \"Gestionar\" en el evento: vas a ver las entradas vendidas, los ingresos, el cupo restante y quién compró.",
  },
  {
    categoria: "organizador",
    pregunta: "¿Puedo ser comprador y organizador a la vez?",
    respuesta:
      "Son cuentas distintas. Para cambiar de modo cerrá sesión y entrá con la otra cuenta, o creá una nueva con el otro rol.",
  },
  {
    categoria: "todas",
    pregunta: "Olvidé mi contraseña",
    respuesta:
      "En la pantalla de inicio de sesión tocá \"¿Olvidaste tu contraseña?\". Te enviamos un código para elegir una nueva (en esta versión el código se muestra en pantalla).",
  },
  {
    categoria: "todas",
    pregunta: "¿Cómo cambio mis datos o mi foto?",
    respuesta: "Andá a Perfil > Editar perfil. Ahí podés cambiar tu foto, nombre, teléfono, ciudad y contraseña.",
  },
  {
    categoria: "todas",
    pregunta: "¿Cómo elimino mi cuenta?",
    respuesta:
      "En Editar perfil, al final, tocá \"Eliminar cuenta\". Necesitás tu contraseña y no tener entradas activas.",
  },
];
