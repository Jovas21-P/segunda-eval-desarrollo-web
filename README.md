# 🍔 FoodExpress

Plataforma web de **reservas y pedidos de comida en línea** con API REST, autenticación JWT, carrito, historial de pedidos, pagos con Stripe (modo real o simulado) y estimación de entrega basada en clima.

Proyecto desarrollado para la **Segunda Evaluación de Desarrollo Web**.

[![CI](https://github.com/tu-usuario/foodexpress-app/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/foodexpress-app/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-3c873a)
![Express](https://img.shields.io/badge/Express-4-000000)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Tabla de contenido

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Inicio rápido](#-inicio-rápido)
- [Credenciales demo](#-credenciales-demo)
- [API REST](#-api-rest)
- [Seguridad](#-seguridad)
- [Servicios de terceros](#-servicios-de-terceros)
- [Pruebas](#-pruebas)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Variables de entorno](#-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Control de versiones](#-control-de-versiones)
- [Documentación adicional](#-documentación-adicional)
- [Licencia](#-licencia)

---

## ✨ Características

### Experiencia de usuario
- Landing page con hero, favoritos del menú y secciones informativas.
- Catálogo con búsqueda, filtros por categoría, stock y precios en MXN.
- Carrito persistente en `localStorage`, con cantidades y cálculo de envío.
- Checkout con dirección, notas, método de pago y geolocalización opcional.
- Historial de pedidos con estados, importes, clima y ETA.
- Diseño responsive, tema oscuro y componentes accesibles.
- Páginas de login, registro y 404.

### Backend
- API REST versionada en `/api/v1`.
- Autenticación JWT con expiración, issuer y recarga del usuario en cada petición.
- Contraseñas hasheadas con bcrypt (nunca se devuelven en las respuestas).
- Roles `customer` y `admin` con middleware de autorización.
- Validación y saneamiento de entradas con express-validator.
- Consultas SQL **parametrizadas** y transacciones atómicas de pedidos/stock.
- Cálculo de totales **siempre en el servidor** (nunca se confía en el cliente).
- Cancelación automática del pedido y restauración de stock si el pago falla.
- Rate limiting global y específico para autenticación.
- Helmet, CORS con lista blanca, JSON escapado y CSP.

### Integraciones
- **Stripe Payment Intents** (real) o proveedor **mock** (demo) mediante Factory Pattern.
- **OpenWeatherMap** para ajustar el ETA según el clima, con caché y fallback simulado.

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Node.js, Express 4 |
| Base de datos | SQLite (`better-sqlite3`), WAL |
| Autenticación | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| Validación | `express-validator` |
| Seguridad | Helmet, CORS, express-rate-limit |
| Pagos | Stripe API / Mock |
| Clima | OpenWeatherMap |
| Frontend | HTML5, TailwindCSS 3, JavaScript modular (ES2020) |
| Pruebas | Jest, Supertest |
| Calidad | ESLint, GitHub Actions |
| Documentación | Markdown, Postman Collection |

---

## 🚀 Inicio rápido

### Requisitos

- **Node.js ≥ 20** (recomendado 20 o 22 LTS)
- npm ≥ 10
- Git

`better-sqlite3` incluye binarios precompilados para las versiones soportadas de Node. Si tu sistema no los encuentra, necesitarás herramientas de compilación (Python + build-essential / Visual Studio Build Tools).

### Instalación

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/foodexpress-app.git
cd foodexpress-app

# 2. Instalar dependencias
npm install

# 3. Crear configuración local
cp .env.example .env
# Windows (PowerShell): Copy-Item .env.example .env

# 4. Iniciar en modo desarrollo
npm run dev
```

Abre **http://localhost:3000**.

La base de datos se crea automáticamente en `data/foodexpress.db` con el esquema, 13 platillos de ejemplo y un usuario administrador.

### Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia con `nodemon` (recarga automática) |
| `npm test` | Ejecuta Jest + Supertest |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Reporte de cobertura en `coverage/` |
| `npm run lint` | Analiza el código con ESLint |
| `npm run lint:fix` | Corrige problemas automáticamente |
| `npm run build:css` | Compila Tailwind a `public/css/styles.css` |
| `npm run watch:css` | Recompila Tailwind al cambiar clases |
| `npm run db:reset` | Borra la base local (se recrea al iniciar) |

> El CSS compilado está versionado, por lo que **no necesitas compilar Tailwind** para ejecutar la app. Solo ejecuta `npm run build:css` si agregas o cambias clases.

---

## 👤 Credenciales demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@foodexpress.com` | `Admin123!` |

El administrador puede consultar todos los pedidos en `GET /api/v1/orders`. Los usuarios nuevos se registran desde `/register.html` y reciben rol `customer`.

> En producción cambia `ADMIN_PASSWORD` y `JWT_SECRET` antes del primer arranque.

---

## 🔌 API REST

Base URL: **`http://localhost:3000/api/v1`**

### Formato de respuesta

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "email", "message": "El correo electrónico no es válido" }]
  }
}
```

### Endpoints

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Estado del servicio |
| `GET` | `/config` | — | Configuración pública de entrega/pagos |
| `POST` | `/auth/register` | — | Registro + JWT (rate limit estricto) |
| `POST` | `/auth/login` | — | Login + JWT (rate limit estricto) |
| `GET` | `/auth/me` | JWT | Perfil del usuario autenticado |
| `GET` | `/products` | — | Catálogo (`category`, `search`, `limit`) |
| `GET` | `/products/categories` | — | Categorías disponibles |
| `GET` | `/products/:id` | — | Detalle de producto |
| `POST` | `/orders` | JWT | Crear pedido y procesar pago |
| `GET` | `/orders/user` | JWT | Historial del usuario |
| `GET` | `/orders/:id` | JWT | Detalle (dueño o admin) |
| `GET` | `/orders` | JWT admin | Todos los pedidos |
| `GET` | `/delivery/estimate?lat=&lon=` | — | Clima + ETA de entrega |

### Ejemplos con cURL

#### Registro

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Martínez",
    "email": "ana@example.com",
    "password": "Password123",
    "phone": "55 1234 5678",
    "address": "Av. Reforma 123, Col. Centro, CDMX"
  }'
```

#### Login y token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Password123"}' \
  | jq -r '.data.token')

echo "$TOKEN"
```

#### Catálogo con filtros

```bash
curl "http://localhost:3000/api/v1/products?category=Postres&search=cheesecake"
```

#### Crear pedido

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": 4, "quantity": 2 },
      { "productId": 11, "quantity": 1 }
    ],
    "deliveryAddress": "Av. Reforma 123, Col. Centro, CDMX",
    "paymentMethod": "card",
    "notes": "Sin cebolla",
    "location": { "lat": 19.4326, "lon": -99.1332 }
  }'
```

#### Historial

```bash
curl http://localhost:3000/api/v1/orders/user \
  -H "Authorization: Bearer $TOKEN"
```

#### Clima y ETA

```bash
curl "http://localhost:3000/api/v1/delivery/estimate?lat=19.4326&lon=-99.1332"
```

### Cuerpo de `POST /orders`

| Campo | Tipo | Requerido | Reglas |
| --- | --- | --- | --- |
| `items` | array | Sí | 1–30 elementos |
| `items[].productId` | integer | Sí | Producto activo existente |
| `items[].quantity` | integer | Sí | 1–20 y stock suficiente |
| `deliveryAddress` | string | Sí | 10–250 caracteres |
| `paymentMethod` | string | Sí | `card` o `cash` |
| `notes` | string | No | Máx. 300 caracteres |
| `location` | object | No | `{ lat: -90..90, lon: -180..180 }` |

### Estados de pedido

`pending` → `confirmed` → `preparing` → `on_the_way` → `delivered` · `pending_payment` · `cancelled`

### Estados de pago

`pending` · `paid` · `failed`

> Con `PAYMENT_PROVIDER=mock` el pago con tarjeta se aprueba al instante y el pedido pasa a `confirmed`. Con Stripe real, si el PaymentIntent requiere acción, el pedido queda en `pending_payment`.

### Colección Postman

Importa [`docs/FoodExpress.postman_collection.json`](docs/FoodExpress.postman_collection.json). Incluye una prueba automática que guarda el token del login en la variable `token`.

---

## 🔐 Seguridad

| Control | Implementación |
| --- | --- |
| Contraseñas | bcrypt con 10 rondas (`BCRYPT_ROUNDS`) |
| Sesiones | JWT firmado, expiración (`JWT_EXPIRES_IN`), issuer |
| Autorización | Roles + verificación de propiedad del pedido |
| Fuerza bruta | Rate limit global (300/15 min) y auth (12/15 min) |
| Inyección SQL | Consultas preparadas con parámetros en todos los repositorios |
| XSS | `sanitizeText`, JSON escapado, CSP y `textContent` en el frontend |
| Cabeceras HTTP | Helmet: CSP, `nosniff`, `frame-ancestors 'none'`, referrer policy |
| CORS | Lista blanca configurable con `CORS_ORIGINS` |
| Datos sensibles | Nunca se devuelve `password_hash`; errores 500 genéricos en producción |
| Fuerza bruta / enumeración | Mismo mensaje para correo inexistente y contraseña incorrecta |

> El frontend inserta datos del usuario con `textContent` y escapa plantillas HTML con `escapeHtml`, evitando XSS almacenado.

---

## 🌐 Servicios de terceros

### Stripe (pagos)

Configura en `.env`:

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=mxn
```

- Se crea un **Payment Intent** por pedido con idempotencia.
- El backend devuelve `clientSecret` si Stripe lo genera.
- Si la pasarela falla, el pedido se cancela y el stock se restaura.
- Para cobrar realmente en el navegador falta completar la confirmación con Stripe.js; el backend ya expone el `clientSecret` y el flujo de estados.

### OpenWeatherMap (clima)

```env
OPENWEATHER_API_KEY=tu_api_key
```

- `GET /delivery/estimate` consulta clima actual con `units=metric` y `lang=es`.
- Caché de 10 minutos por ubicación.
- Sin clave (o si la API falla) se usa un clima simulado determinista, ideal para pruebas y demo.

---

## 🧪 Pruebas

```bash
npm test
npm run test:coverage
```

Resultado actual: **32 pruebas en 6 suites, todas en verde**.

| Archivo | Tipo | Qué cubre |
| --- | --- | --- |
| `tests/unit/pricing.test.js` | Unitaria | Subtotal, envío gratis, pedido vacío |
| `tests/unit/security.test.js` | Unitaria | bcrypt, JWT, saneamiento XSS |
| `tests/unit/payments.test.js` | Unitaria | Factory de pagos, Stripe sin clave, merge de ítems |
| `tests/integration/auth.test.js` | Integración | Registro, duplicados, login, JWT, admin |
| `tests/integration/products.test.js` | Integración | Catálogo, filtros, detalle, config, clima |
| `tests/integration/orders.test.js` | Integración | Totales, stock, pago tarjeta/efectivo, ownership, roles |

Las pruebas usan SQLite en memoria (`DATABASE_FILE=:memory:`) y reinician el seed antes de cada caso.

---

## 📁 Estructura del proyecto

```
foodexpress-app/
├── .github/
│   ├── workflows/ci.yml          # Lint + tests + build CSS
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── ARQUITECTURA.md
│   ├── CONTROL_DE_VERSIONES.md
│   └── FoodExpress.postman_collection.json
├── public/                       # Frontend
│   ├── index.html
│   ├── menu.html
│   ├── orders.html
│   ├── login.html
│   ├── register.html
│   ├── 404.html
│   ├── css/styles.css            # Tailwind compilado (versionado)
│   └── js/
│       ├── api.js
│       ├── session.js
│       ├── ui.js
│       ├── cart.js
│       ├── home.js
│       ├── menu.js
│       ├── orders.js
│       └── auth-pages.js
├── scripts/reset-db.js
├── src/
│   ├── app.js                    # Express app
│   ├── server.js                 # Listen + graceful shutdown
│   ├── config/                   # env + SQLite
│   ├── controllers/
│   ├── database/                 # schema + seed
│   ├── middlewares/              # auth, errors, rate limit, validation
│   ├── repositories/             # Repository Pattern
│   ├── routes/
│   ├── services/
│   │   └── payments/             # Factory + Mock + Stripe
│   ├── styles/tailwind.css
│   ├── utils/
│   └── validators/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── helpers.js
│   └── setupEnv.js
├── .env.example
├── eslint.config.js
├── jest.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## ⚙️ Variables de entorno

| Variable | Default | Descripción |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `production` o `test` |
| `PORT` | `3000` | Puerto HTTP |
| `TRUST_PROXY` | `false` | Activar si está detrás de un proxy (`true`) |
| `JWT_SECRET` | (dev) | **Obligatorio en producción** |
| `JWT_EXPIRES_IN` | `2h` | Expiración del token |
| `BCRYPT_ROUNDS` | `10` | Coste del hash |
| `DATABASE_FILE` | `./data/foodexpress.db` | Ruta de SQLite o `:memory:` |
| `CORS_ORIGINS` | `localhost:3000` | Orígenes permitidos, separados por coma |
| `PAYMENT_PROVIDER` | `mock` | `mock` o `stripe` |
| `STRIPE_SECRET_KEY` | — | Clave secreta de Stripe |
| `STRIPE_CURRENCY` | `mxn` | Moneda ISO |
| `OPENWEATHER_API_KEY` | — | Clave de OpenWeatherMap |
| `DELIVERY_BASE_ETA_MINUTES` | `25` | ETA base |
| `DELIVERY_FEE_CENTS` | `3500` | Envío en centavos ($35.00) |
| `DELIVERY_FREE_FROM_CENTS` | `30000` | Envío gratis desde $300.00 |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Ventana de rate limit (15 min) |
| `RATE_LIMIT_MAX` | `300` | Peticiones por ventana |
| `AUTH_RATE_LIMIT_MAX` | `12` | Intentos de auth por ventana |
| `ADMIN_NAME` | Administrador FoodExpress | Nombre del admin semilla |
| `ADMIN_EMAIL` | `admin@foodexpress.com` | Correo del admin semilla |
| `ADMIN_PASSWORD` | `Admin123!` | Contraseña del admin semilla |

---

## ☁️ Despliegue

### Render / Railway (recomendado, servicio único)

1. Conecta el repositorio.
2. Configura:
   - **Build command:** `npm ci && npm run build:css`
   - **Start command:** `npm start`
   - **Node version:** 20 o 22
3. Variables de entorno mínimas:
   - `NODE_ENV=production`
   - `JWT_SECRET=<cadena larga aleatoria>`
   - `DATABASE_FILE=/var/data/foodexpress.db`
   - `CORS_ORIGINS=https://tu-dominio.com`
   - `PAYMENT_PROVIDER=mock` (o `stripe` con claves)
   - `ADMIN_PASSWORD=<contraseña segura>`
4. Agrega un **disco persistente** montado en `/var/data` para conservar SQLite entre despliegues.

### Vercel

Vercel es ideal para el frontend estático, pero el backend Express necesita un servicio aparte (Render/Railway/Fly.io). Si separas frontend y API, cambia `BASE_URL` en `public/js/api.js` y añade el dominio del frontend a `CORS_ORIGINS`.

### Docker (opcional)

El proyecto no incluye Dockerfile por defecto; para producirlo necesitarías Node 20 + build tools para `better-sqlite3` y un volumen para `data/`.

---

## 🔀 Control de versiones

El proyecto sigue **GitHub Flow** con commits convencionales y PR obligatorios hacia `main`. La documentación completa de la Parte 1 (justificación de Git/GitHub, flujo, protección de ramas, CI y enlaces) está en:

📄 [`docs/CONTROL_DE_VERSIONES.md`](docs/CONTROL_DE_VERSIONES.md)

Workflow de CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta lint, pruebas y verificación del CSS compilado.

---

## 📚 Documentación adicional

- [Arquitectura, patrones y flujos](docs/ARQUITECTURA.md)
- [Control de versiones y configuración del repositorio](docs/CONTROL_DE_VERSIONES.md)
- [Colección de Postman](docs/FoodExpress.postman_collection.json)

---

## 🧭 Limitaciones y trabajo futuro

- Pago con Stripe real requiere completar la confirmación en el cliente con Stripe.js (el backend ya crea el PaymentIntent y expone `clientSecret`).
- No hay cancelación manual de pedidos por parte del usuario.
- No hay notificaciones push ni seguimiento en tiempo real (WebSockets).
- SQLite es suficiente para la demo; para producción con alta concurrencia se recomienda PostgreSQL.
- El panel de administración es solo la API (`GET /orders`); no se incluyó una UI administrativa.

---

## 📄 Licencia

Distribuido bajo licencia **MIT**. Consulta [`LICENSE`](LICENSE).

---

Hecho con 🍔 y ☕ para la Segunda Evaluación de Desarrollo Web.
