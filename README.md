# AI-Ticket-it - Plataforma de publicación de eventos y venta de entradas

Trabajo Practico Individual de Desarrollo con Inteligencia Artificial - 2C 2026
**UTN BA - Catedra Desarrollo de Software** - Otero María Mercedes

---

## Descripcion

**AI Ticket It** es una plataforma orientada a la publicación y gestión de eventos, permitiendo a organizadores crear espectáculos y administrar sus ventas, mientras que los usuarios pueden explorar eventos, comprar entradas, realizar el seguimiento de sus compras, guardar eventos favoritos y dejar reseñas sobre su experiencia.
---

## Stack tecnologico

| Capa | Tecnologia |
|------|-----------|
| Back-End | Node.js + Express |
| Front-End | React Native (mobile) |
| Persistencia | En memoria (in-memory) |

La aplicacion se ejecuta de forma local en un dispositivo movil.

---

## Modelo de dominio
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

## Estructura del proyecto

```
AI-Ticket-It/
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── models/
│       ├── repositories/
│       ├── services/
│       ├── controllers/
│       ├── routes/
│       └── app.js
│
└── frontend/
    ├── package.json
    └── src/

```

---

## Como correr el proyecto

Desde la raiz instalar todas las dependencias:

```bash
npm install
```
---

## Entrega

La entrega consiste en un video de **5 a 10 minutos** con:

1. Demostracion de un flujo funcional completo (a eleccion)
2. Explicacion de la implementacion en Back-End y Front-End
3. Recorrido por la interfaz grafica
4. Conclusion sobre el uso de IA en el proceso de desarrollo: ventajas, desventajas, dificultades y aprendizajes