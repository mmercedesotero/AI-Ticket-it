# AI Ticket It - Plataforma de publicación de eventos y venta de entradas

Trabajo Práctico Individual de Desarrollo con Inteligencia Artificial - 2C 2026
**UTN BA - Cátedra Desarrollo de Software** - Otero María Mercedes

---

## Índice

1. [De qué trata el proyecto](#1-de-qué-trata-el-proyecto)
2. [Qué se puede hacer](#2-qué-se-puede-hacer)
3. [Tecnologías](#3-tecnologías)
4. [Estructura del proyecto (monorepo)](#4-estructura-del-proyecto-monorepo)
5. [Cómo correr el proyecto](#5-cómo-correr-el-proyecto)
6. [Cuentas de prueba](#6-cuentas-de-prueba)
7. [Pantallas de la app](#7-pantallas-de-la-app)
8. [Backend: arquitectura y API](#8-backend-arquitectura-y-api)
9. [Reglas de negocio y simulaciones](#9-reglas-de-negocio-y-simulaciones)
10. [Diseño: colores e identidad visual](#10-diseño-colores-e-identidad-visual)
11. [Limitaciones conocidas](#11-limitaciones-conocidas)
12. [Modelo de dominio](#12-modelo-de-dominio)
13. [Entrega](#13-entrega)

---

## 1. De qué trata el proyecto

**AI Ticket It** es una aplicación móvil para publicar eventos y vender entradas. Tiene dos tipos de cuenta:

- **Comprador:** explora eventos, guarda favoritos, compra (o reserva) entradas, paga con tarjeta, sigue el estado de sus compras, chatea con el organizador, descarga el comprobante en PDF y deja reseñas de los eventos a los que fue.
- **Organizador:** crea eventos con sus tipos de entrada y su portada, ve cuánto vende cada uno, quiénes compraron, recibe avisos (mañana es tu evento, se están agotando las entradas, etc.) y responde a los compradores.

La aplicación se ejecuta de forma local: el **backend** corre en la computadora y la **app** se abre en el celular con Expo Go.

---

## 2. Qué se puede hacer

### Cuentas
- Crear cuenta como comprador u organizador (con foto o logo opcional), iniciar sesión y recuperar la contraseña con un código.
- Editar el perfil: foto, nombre, teléfono (con selector de país y cantidad de dígitos según el país), ciudad y contraseña.
- Preferencia de "pago rápido" y eliminación de la cuenta.

### Comprador
- **Explorar:** buscador, categorías, ordenar por fecha, precio o puntaje, carrusel de favoritos y etiquetas "Agotándose" / "Agotado".
- **Favoritos:** guardar y quitar eventos con el corazón.
- **Comprar:** elegir varios tipos de entrada a la vez, pagar con una tarjeta guardada o **reservar sin pagar** (la reserva dura 24 horas).
- **Mis compras:** pestañas Activas y Pasadas, entrada con código QR, seguimiento del estado, cancelación, comprobante en PDF y chat con el organizador.
- **Tarjetas:** guardar hasta 5 tarjetas, con validaciones y sin guardar nunca el número completo ni el CVV.
- **Mensajes:** una bandeja con todas las conversaciones con los organizadores (último mensaje, hora y cuántos faltan leer). Cada mensaje nuevo genera un aviso a la otra persona, que al tocarlo abre el chat.
- **Calendario:** el mes con las entradas y los favoritos marcados.
- **Notificaciones:** compras, pagos, recordatorios ("tu evento es mañana"), reservas por vencer y novedades, agrupadas por fecha.
- **Reseñas:** puntuar de 1 a 5 estrellas un evento al que se asistió.
- **Ayuda y soporte** y **Términos y condiciones** (con descarga en PDF).

### Organizador
- Panel con entradas vendidas, ingresos, eventos activos y calificación promedio.
- Filtros por estado (próximos, finalizados) y chips (hoy y mañana, esta semana, agotándose, sin ventas).
- Crear eventos con portada, categoría y varios tipos de entrada.
- **Editar** un evento que todavía no se realizó (datos, portada, precios y cupos, y agregar tipos de entrada) y **eliminarlo**. Si cambia la fecha, se avisa a los compradores; si se elimina, se cancelan las compras activas y se reembolsan las pagadas.
- Gestionar cada evento: ventas, cupo restante y listado de compradores con chat.
- Notificaciones propias: mañana o hoy es tu evento, se está agotando, todavía no vendiste, nueva reseña y mensajes nuevos de los compradores.
- **Mensajes:** bandeja con los chats de todos sus eventos, con el contador de no leídos.

---

## 3. Tecnologías

| Capa | Tecnología |
|------|-----------|
| Back-End | Node.js + Express 5 |
| Tests | Ejecutor de tests de Node (`node:test`) y `fetch`, sin librerías extra |
| Autenticación | JWT (`jsonwebtoken`) y contraseñas con hash `scrypt` (módulo `crypto` de Node) |
| Front-End | React Native con Expo (SDK 58) |
| Navegación | React Navigation (stack + tabs inferiores) |
| Íconos | `@expo/vector-icons` (Ionicons) |
| QR | `react-native-qrcode-svg` |
| PDF y compartir | `expo-print` y `expo-sharing` |
| Galería de imágenes | `expo-image-picker` |
| Persistencia | **En memoria** (in-memory): ver [limitaciones](#11-limitaciones-conocidas) |

---

## 4. Estructura del proyecto (monorepo)

El repositorio es un **monorepo**: una sola carpeta con el backend y el frontend como paquetes separados dentro de `packages/`. Cada paquete tiene su propio `package.json` y sus dependencias se instalan por separado.

```
AI-Ticket-It/
├── README.md
└── packages/
    ├── backend/                 API REST (Node + Express)
    │   ├── package.json
    │   ├── server.js            arranca el servidor (puerto 3000) y carga los datos de prueba
    │   ├── tests/               tests automáticos del backend (ver "Correr los tests")
    │   └── src/
    │       ├── app.js           configura Express y monta las rutas
    │       ├── container.js     repositorios y servicios compartidos
    │       ├── seeds.js         datos de prueba
    │       ├── models/          entidades del dominio (Usuario, Evento, Compra...)
    │       ├── repositories/    guardan los datos en memoria
    │       ├── services/        reglas de negocio
    │       ├── controllers/     reciben el pedido HTTP y devuelven la respuesta
    │       ├── routes/          rutas de cada recurso
    │       ├── middlewares/     autenticación por rol y manejo de errores
    │       ├── errors/          errores propios (400, 401, 403, 404)
    │       └── utils/           contraseñas, tokens, imágenes, reservas
    │
    └── frontend/                app móvil (React Native + Expo)
        ├── package.json
        ├── App.js               navegación y proveedores
        ├── app.json             configuración de Expo
        ├── img/                 fotos de los eventos de prueba
        └── src/
            ├── api.js           ⚠ acá se configura la IP del backend
            ├── tema.js          colores y medidas de toda la app
            ├── screens/         una pantalla por archivo
            ├── componentes/     piezas reutilizables (tarjetas, chips, avisos...)
            └── ...              estado global (sesión, eventos, notificaciones) y utilidades
```

El backend está organizado en capas: **ruta → controlador → servicio → repositorio → modelo**. Los controladores no tienen lógica de negocio; esa vive en los servicios, y los repositorios son lo único que sabe cómo se guardan los datos.

---

## 5. Cómo correr el proyecto

### Requisitos
- **Node.js** 18 o superior (se desarrolló con Node 24) y **npm**.
- La app **Expo Go** instalada en el celular (Android o iPhone).
- La computadora y el celular tienen que estar **en la misma red wifi**.

### Paso 1: levantar el backend

```bash
cd packages/backend
npm install
npm run dev
```

Con `npm run dev` el servidor se reinicia solo al guardar un archivo (usa nodemon). Para correrlo normal: `npm start`.

Cuando funciona, la consola muestra `Servidor funcionando` y la API queda en `http://localhost:3000`. Al arrancar se cargan los [datos de prueba](#6-cuentas-de-prueba).

### Paso 2: configurar la IP del backend en la app ⚠

El celular **no puede** usar `localhost` para llegar al backend: `localhost` sería el propio celular. Tiene que usar la **IP de tu computadora en la red wifi**.

1. Averiguá tu IP:
   - **Windows:** abrí una terminal y ejecutá `ipconfig`. Buscá "Dirección IPv4" del adaptador de wifi (por ejemplo `192.168.1.35`).
   - **Mac / Linux:** `ifconfig` o `ip addr`.
2. Abrí [`packages/frontend/src/api.js`](packages/frontend/src/api.js) y cambiá la primera línea:

```js
export const API = "http://TU-IP-ACÁ:3000";   // ejemplo: "http://192.168.1.35:3000"
```

Si tu IP cambia (por ejemplo al conectarte a otra red), hay que volver a cambiarla.

### Paso 3: levantar la app

En **otra terminal**:

```bash
cd packages/frontend
npm install
npx expo start -c
```

El `-c` limpia el caché, conviene usarlo la primera vez o cuando algo se vea raro. Aparece un código QR en la terminal: escanealo con **Expo Go** (en Android) o con la cámara (en iPhone).

### Correr los tests del backend

Los tests levantan el servidor real en un puerto libre, con los datos de prueba, y prueban la API de punta a punta. No necesitan instalar nada extra (usan el ejecutor de tests que trae Node) ni tener el servidor corriendo.

```bash
cd packages/backend
npm test
```

Son más de 200 tests y tardan unos 20 segundos. Cubren:

| Archivo | Qué prueba |
|---------|-----------|
| `auth.test.js` | Registro, login, sesión por token, editar perfil, cambiar y recuperar la contraseña, eliminar la cuenta y fotos de perfil. |
| `eventos.test.js` | Búsqueda y filtros, crear, portada, editar y eliminar eventos, con los permisos de cada rol. |
| `compras.test.js` | Comprar (cupos y validaciones), pagar (incluido el rechazo con `0000`), cancelar y reembolsar, y las reservas que vencen. |
| `tarjetas-favoritos.test.js` | Validaciones de tarjetas, duplicadas y máximo de 5; favoritos. |
| `resenias.test.js` | Quién puede puntuar, límites del puntaje y promedio del organizador. |
| `notificaciones.test.js` | Avisos, marcar como leídos y recordatorios de comprador y organizador. |
| `mensajes.test.js` | Chat entre comprador y organizador, avisos, bandeja y mensajes sin leer. |
| `unitarios.test.js` | Modelos y utilidades: contraseñas, tokens, imágenes, estados de compra y qué datos salen en las respuestas. |

Para correr un solo archivo: `node --test tests/compras.test.js`.

### Si algo no anda

| Problema | Qué probar |
|----------|-----------|
| La app dice "Network request failed" o no carga nada | Revisá que la IP de `api.js` sea la correcta, que el backend esté corriendo y que ambos estén en la misma wifi. |
| Sigue sin conectar | El firewall de Windows puede estar bloqueando el puerto 3000. Permití a Node.js en redes privadas. |
| Los cambios no se ven | Cerrá Expo Go y volvé a abrirlo, o ejecutá `npx expo start -c`. |
| Se perdieron las cuentas o eventos que creaste | Es normal: los datos están en memoria y se reinician con el servidor. Ver [limitaciones](#11-limitaciones-conocidas). |
| La instalación de paquetes es muy lenta | Si el proyecto está en una carpeta sincronizada (OneDrive), pausá la sincronización mientras se instala. |

---

## 6. Cuentas de prueba

Todas las cuentas de prueba tienen la contraseña **`123456`**.

### Compradores
| Email | Nombre | Para probar |
|-------|--------|-------------|
| `ana@mail.com` | Ana Pérez | La cuenta principal: tiene favoritos, dos tarjetas, entradas confirmadas, una reserva pendiente y un evento para mañana. |
| `tomas@mail.com` | Tomas Gómez | Tiene una tarjeta terminada en `0000` para ver cómo se rechaza un pago. |
| `mateo@mail.com` | Mateo Rodríguez | Tiene el "pago rápido" apagado. |
| `mer@`, `lucia@`, `valentina@`, `joaquin@`, `sofia@`, `benjamin@`, `camila@`, `santiago@`, `julieta@`, `franco@` `mail.com` | — | Otros compradores con compras, reseñas y tarjetas. |

### Organizadores
| Email | Organización | Para probar |
|-------|--------------|-------------|
| `live@mail.com` | Live Nation | Un evento para mañana y otro casi agotado. |
| `teatro@mail.com` | Teatro BA | El Stand-Up Comedy es mañana. |
| `sala@mail.com` | Sala Mayor | Un evento de hoy, ya agotado. |
| `ruido@`, `comedia@`, `sur@` `mail.com` | Otras productoras | Distintos eventos y reseñas. |

También se puede crear una cuenta nueva desde la pantalla de registro.

---

## 7. Pantallas de la app

### Antes de ingresar
| Pantalla | Qué hace |
|----------|----------|
| **Iniciar sesión** | Ingreso con email y contraseña. |
| **Crear cuenta** | Elegir rol (comprador u organizador), foto o logo opcional, términos y condiciones. |
| **Recuperar contraseña** | Pide un código (simulado) y permite elegir una contraseña nueva. |
| **Términos y condiciones** | Texto legal con buscador y descarga en PDF. |

### Comprador (barra inferior: Eventos, Mis compras, Calendario, Notificaciones, Perfil)
| Pantalla | Qué hace |
|----------|----------|
| **Eventos** | Inicio: buscador, categorías, favoritos y próximos eventos con orden por fecha, precio o puntaje. Arriba a la derecha, el ícono de mensajes y la foto de perfil. |
| **Detalle del evento** | Información, descripción, entradas disponibles, reseñas y botón de favorito. |
| **Seleccionar entradas** | Cantidad por tipo de entrada, tarjeta, resumen, y los botones "Pagar" o "Reservar sin pagar". |
| **Confirmar compra / Pago** | Hoja de confirmación y animación de pago aprobado o rechazado. |
| **Mis compras** | Activas y Pasadas, con el estado de cada compra y cuánto falta para el evento o para que venza la reserva. |
| **Entrada** | El ticket con código QR, historial de estados, chat, comprobante en PDF y cancelación. |
| **Mensajes** | Bandeja de chats: se abre desde el ícono de mensajes (arriba, junto a la foto en Eventos; en la cabecera del panel del organizador) o desde el Perfil. |
| **Chat** | Conversación entre comprador y organizador, ligada a una compra. |
| **Reseña** | Puntuar y comentar un evento ya utilizado. |
| **Calendario** | Mes con las entradas y favoritos marcados, con filtros. |
| **Notificaciones** | Avisos agrupados por Hoy, Esta semana y Anteriores, con filtros. |
| **Perfil** | Datos, estadísticas y accesos a favoritos, tarjetas, ayuda y términos. |
| **Editar perfil** | Foto, nombre, teléfono, ciudad, contraseña, pago rápido y eliminar cuenta. |
| **Favoritos** | Todos los eventos guardados. |
| **Métodos de pago / Agregar tarjeta** | Administrar las tarjetas guardadas. |
| **Ayuda y soporte** | Preguntas frecuentes con buscador y categorías. |

### Organizador (barra inferior: Mis eventos, Calendario, Notificaciones, Perfil)
| Pantalla | Qué hace |
|----------|----------|
| **Panel organizador** | Resumen de ventas, aviso de eventos de hoy o mañana, filtros, lista de eventos (con Editar y Gestionar) y acceso a Mensajes. |
| **Crear / Editar evento** | Portada, nombre, fecha, descripción, categoría y tipos de entrada. Al editar un evento existente también permite eliminarlo. |
| **Gestionar evento** | Entradas vendidas, ingresos, cupo restante y compradores con acceso al chat. |
| **Calendario, Notificaciones, Perfil** | Las mismas pantallas, adaptadas a los eventos del organizador. |

---

## 8. Backend: arquitectura y API

### Autenticación y roles
- Al iniciar sesión o registrarse, el servidor devuelve un **token JWT** (válido 8 horas) que la app manda en cada pedido: `Authorization: Bearer <token>`.
- Los roles son `COMPRADOR` y `ORGANIZADOR`. El middleware `auth` identifica quién pregunta y limita cada ruta: por ejemplo, solo un organizador puede crear eventos y solo un comprador puede comprar.
- Los errores se devuelven con el código HTTP correcto (400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe) y un mensaje `{ "error": "..." }`.

### Endpoints principales

| Recurso | Método y ruta | Descripción |
|---------|---------------|-------------|
| Auth | `POST /auth/registro` · `POST /auth/login` | Crear cuenta e iniciar sesión |
| | `POST /auth/recuperar` · `POST /auth/restablecer` | Recuperar la contraseña con un código |
| | `GET /auth/perfil` · `PUT /auth/perfil` | Ver y editar el perfil |
| | `PUT /auth/password` · `DELETE /auth/cuenta` | Cambiar contraseña y eliminar la cuenta |
| Eventos | `GET /eventos` | Listar con filtros: `texto`, `categoriaId`, `orden` (fecha, precio, puntaje) y `direccion` |
| | `GET /eventos/:id` · `GET /eventos/:id/portada` | Detalle y portada del evento |
| | `POST /eventos` · `PUT /eventos/:id` · `DELETE /eventos/:id` | Solo organizadores, y solo sobre sus propios eventos |
| Categorías | `GET /categorias` | Listar categorías |
| Compras | `GET /compras` | Las del comprador, o `?eventoId=` para el organizador dueño del evento |
| | `POST /compras` | Comprar o reservar entradas (queda pendiente de pago) |
| | `PUT /compras/:id/pagar` | Pagar con una tarjeta guardada |
| | `PUT /compras/:id/cancelar` | Cancelar (reembolsa si ya estaba pagada) |
| | `GET /compras/chats` | Bandeja de chats de quien pregunta, con el último mensaje y los no leídos |
| | `GET /compras/:id/mensajes` · `POST /compras/:id/mensajes` | Chat entre comprador y organizador (abrirlo lo marca como leído; escribir avisa a la otra persona) |
| Reseñas | `GET /resenias` · `POST /resenias` | Listar y puntuar (solo con entrada utilizada) |
| Favoritos | `GET /favoritos` · `POST /favoritos/:eventoId` · `DELETE /favoritos/:eventoId` | Eventos favoritos |
| Tarjetas | `GET /tarjetas` · `POST /tarjetas` · `DELETE /tarjetas/:id` | Tarjetas guardadas |
| Notificaciones | `GET /notificaciones` | Avisos de quien pregunta |
| | `PUT /notificaciones/leidas` · `PUT /notificaciones/:id/leida` | Marcar como leídas |
| Fotos | `GET /fotos/:rol/:id` | Foto de perfil de un comprador o logo de un organizador |
| Usuarios / Organizadores | CRUD en `/usuarios` y `/organizadores` | Administración básica |

---

## 9. Reglas de negocio y simulaciones

**Estados de una compra:** `PENDIENTE_PAGO` → `CONFIRMADA` → `UTILIZADA`; también puede quedar `CANCELADA` (sin haber pagado) o `REEMBOLSADA` (cancelada después de pagar). Cada cambio queda registrado con su fecha en el historial.

**Reservas:** una compra sin pagar aparta las entradas. A las **12 horas** llega el aviso "Recordá abonar tu entrada" y a las **24 horas** la reserva se cancela sola y las entradas vuelven a estar disponibles. Los plazos se revisan cuando se consultan las compras o las notificaciones (no hay un proceso en segundo plano).

**Pagos simulados:** no se cobra dinero real. Una tarjeta cuyo número termina en `0000` se rechaza (para poder probar el error); cualquier otra se aprueba.

**Tarjetas:** se valida que tengan 16 dígitos, titular, vencimiento no vencido y CVV, no se puede guardar la misma tarjeta dos veces y el máximo es 5. Solo se guardan la marca, los últimos 4 dígitos, el vencimiento y el titular.

**Recuperar contraseña:** como no hay servicio de email, el código de 6 dígitos (válido 10 minutos) se muestra en la pantalla y en la consola del backend.

**Recordatorios y avisos:** se generan al consultar las notificaciones, sin repetirse: "tu evento es mañana" y "es hoy" (comprador y organizador), reservas por vencer, "se está agotando" (quedan 20 entradas o menos) y "todavía no vendiste".

**Mensajes:** cada compra tiene su chat entre el comprador y el organizador del evento. Al escribir se le crea un aviso a la otra persona ("Nuevo mensaje de Ana en Coldplay"); si ya tenía uno sin leer de ese chat se actualiza en vez de crear otro. Al abrir el chat, sus mensajes y el aviso quedan leídos.

**Reseñas:** solo se puede puntuar un evento con una entrada utilizada, una vez por evento, de 1 a 5.

**Editar y eliminar eventos:** solo el organizador dueño puede hacerlo y solo si el evento todavía no se realizó (los ya realizados quedan en el historial y en las reseñas). Al editar, los tipos de entrada existentes se modifican pero no se pueden quitar (podrían tener ventas) y se pueden agregar nuevos; si algo es inválido no se aplica ningún cambio. Si se cambia la fecha se avisa a quienes tienen entradas. Al eliminar, las compras pendientes se cancelan, las pagadas se reembolsan, se avisa a los compradores y el evento sale de los favoritos.

**Cancelaciones:** no se puede cancelar una compra ya utilizada ni de un evento que ya se realizó; al cancelar vuelven los cupos.

---

## 10. Diseño: colores e identidad visual

Todos los colores y medidas están en un solo archivo, [`packages/frontend/src/tema.js`](packages/frontend/src/tema.js). Cambiando un valor ahí se actualiza toda la app.

| Color | Valor | Uso |
|-------|-------|-----|
| Azul noche (`indigo`) | `#0F172A` | Cabecera de Eventos, textos fuertes y títulos |
| Coral (`acento`) | `#EF806C` | Botones principales, chips, etiquetas y detalles |
| Coral suave (`acentoSuave`) | `#FDEEEA` | Fondos de elementos destacados |
| Verde (`exito`) | `#148C5E` | Confirmaciones: pago aprobado, "Confirmada" |
| Rojo (`error`) | `#DC2626` | Errores y acciones destructivas |
| Fondo | `#E9EEF5` | Fondo de las pantallas (más oscuro que las tarjetas para que se note su forma) |
| Blanco | `#FFFFFF` | Tarjetas y campos |
| Borde | `#E2E8F0` | Líneas y bordes finos |
| Gris | `#64748B` / `#94A3B8` | Textos secundarios y de ayuda |

**Criterios de diseño:**
- Estilo "ticket": las entradas tienen forma de boleto con muescas y corte punteado.
- Botones chicos y translúcidos en coral para filtros y acciones secundarias; botón coral sólido para la acción principal.
- Los avisos y confirmaciones aparecen como hojas desde abajo, en lugar de las alertas del sistema.
- Títulos centrados y una animación de "tirar para refrescar" igual en todas las pantallas.

---

## 11. Limitaciones conocidas

Esta es una aplicación de práctica y algunas cosas están simplificadas a propósito:

- **Persistencia en memoria:** todo lo que se crea (cuentas, eventos, compras, tarjetas, fotos, reseñas) vive en la memoria del servidor y **se pierde al reiniciarlo**, volviendo a los datos de prueba. Con `npm run dev` el servidor se reinicia cada vez que se guarda un archivo del backend. La app tampoco recuerda la sesión: al cerrarla hay que volver a ingresar.
- **IP configurada a mano:** la dirección del backend se cambia manualmente en `api.js`.
- **Pagos simulados:** no hay una pasarela de pago real.
- **QR decorativo:** el código QR de la entrada se genera con los datos de la compra, pero no hay una pantalla para escanearlo y validarlo en el acceso.
- **Recuperación de contraseña sin email:** el código se muestra en pantalla.
- **Chat de soporte:** el botón "Chatear con soporte" avisa que no está disponible; el correo de soporte es de ejemplo.
- **Una cuenta, un rol:** comprador y organizador son cuentas distintas; para cambiar de modo hay que cerrar sesión e ingresar con la otra.
- **Compras por tipo de entrada:** al elegir varios tipos a la vez se crea una compra por cada tipo.
- **Fotos:** las imágenes de perfil y de portada se guardan en memoria, comprimidas, y tienen un tope de peso. Las fotos de los eventos de prueba están en `packages/frontend/img/`.
- **Fotos de perfil de prueba:** los compradores de prueba usan retratos de internet, por lo que necesitan conexión para verse (si no cargan, se muestra la inicial).

---

## 12. Modelo de dominio

Modelo base del enunciado (la implementación agrega algunos campos, como las tarjetas, el teléfono o la foto del usuario y el historial de la compra).

```
Usuario
- id: Int
- nombre: String
- apellido: String
- favoritos: Evento[]
- entradasCompradas: Compra[]

Organizador
- id: Int
- nombre: String
- eventos: Evento[]

Evento
- id: Int
- nombre: String
- fecha: DateTime
- descripcion: String
- categoria: Categoria
- tiposEntrada: Entrada[]
- multimedia: Multimedia[]
- organizador: Organizador
- tuPrecioEstaEntre(min, max): Boolean

Entrada
- id: Int
- nombre: String
- precio: Double
- ubicacion: String
- cupoDisponible: Int

Compra
- id: Int
- comprador: Usuario
- evento: Evento
- tipoEntrada: Entrada
- cantidad: Int
- total: Double
- estado: EstadoCompra
- mensajes: Mensaje[]
- actualizarEstado(EstadoCompra): void

EstadoCompra:
PENDIENTE_PAGO |
CONFIRMADA |
UTILIZADA |
CANCELADA |
REEMBOLSADA

Mensaje
- id: Int
- autor: Usuario
- texto: String
- fechaHora: DateTime

Resenia
- id: Int
- comprador: Usuario
- evento: Evento
- detalle: String
- puntuacion: Double

Categoria
- id: Int
- nombre: String
- descripcion: String

Multimedia
- id: Int
- url: String
- tipo: String

CambioEstadoCompra
- id: Int
- compra: Compra
- estado: EstadoCompra
- quien: Usuario
- fechaHora: DateTime
```

---

## 13. Entrega

La entrega consiste en un video de **5 a 10 minutos** con:

1. Demostración de un flujo funcional completo (a elección)
2. Explicación de la implementación en Back-End y Front-End
3. Recorrido por la interfaz gráfica
4. Conclusión sobre el uso de IA en el proceso de desarrollo: ventajas, desventajas, dificultades y aprendizajes
