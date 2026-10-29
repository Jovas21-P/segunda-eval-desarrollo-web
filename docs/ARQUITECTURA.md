# Arquitectura · FoodExpress

## 1. Visión general

FoodExpress es una aplicación web **API REST + frontend desacoplado** servida por el mismo proceso de Express:

- El **frontend** (HTML5 + TailwindCSS + JavaScript modular) consume la API mediante `fetch` y guarda el JWT en `localStorage`.
- El **backend** expone `/api/v1/*`, valida entradas, aplica seguridad y persiste en SQLite.
- La API y el frontend se sirven desde `http://localhost:3000` para simplificar el despliegue y evitar problemas de CORS en la demo.

```
┌──────────────────────────────────────────────────────────────┐
│  Navegador                                                   │
│  index.html · menu.html · orders.html · login/register       │
│  public/js/api.js (fetch + JWT)                              │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS / JSON
┌───────────────────────────▼──────────────────────────────────┐
│  Express (src/app.js)                                        │
│  Helmet · CORS · JSON parser · Rate limit · Static           │
│                                                              │
│  routes → middlewares → controllers → services → repositories │
│                                      │                       │
│                                      ├─ payments (Factory)   │
│                                      └─ weather (API externa) │
└───────────────────────────┬──────────────────────────────────┘
                            │ SQL parametrizado
                    ┌───────▼────────┐
                    │ SQLite (WAL)   │
                    │ data/*.db      │
                    └────────────────┘

Servicios externos:
  Stripe Payment Intents  ← PaymentFactory (mock | stripe)
  OpenWeatherMap          ← weather.service (con fallback simulado)
```

## 2. Stack tecnológico

| Capa | Tecnología | Motivo |
| --- | --- | --- |
| Runtime | Node.js ≥ 20 | JavaScript en servidor, ecosistema maduro |
| Framework HTTP | Express 4 | Middleware sencillo, amplia documentación |
| Base de datos | SQLite + better-sqlite3 | Cero configuración, transacciones síncronas, ideal para demo |
| Autenticación | jsonwebtoken + bcryptjs | JWT estándar y hashing seguro sin compilación nativa |
| Validación | express-validator | Validación y saneamiento declarativos |
| Seguridad HTTP | Helmet, CORS, express-rate-limit | Cabeceras seguras, orígenes restringidos, anti fuerza bruta |
| Pagos | Stripe API (REST) + mock | Integración real opcional y demo sin claves |
| Clima | OpenWeatherMap + simulación | ETA dinámico con fallback resiliente |
| Frontend | HTML5 + TailwindCSS + JS | Sin build de framework, CSS compilado y versionado |
| Pruebas | Jest + Supertest | Unitarias e integración de API |
| Calidad | ESLint + GitHub Actions | Consistencia y CI |

## 3. Capas y responsabilidades

| Carpeta | Responsabilidad |
| --- | --- |
| `src/routes/` | Define endpoints y compone middlewares |
| `src/middlewares/` | Autenticación, autorización, validación, rate limit, errores |
| `src/controllers/` | Traduce HTTP ↔ servicios; respuestas JSON uniformes |
| `src/services/` | Reglas de negocio: auth, pedidos, pagos, clima |
| `src/repositories/` | Acceso a datos con SQL parametrizado (Repository Pattern) |
| `src/database/` | Esquema, seed y configuración de SQLite |
| `src/validators/` | Cadenas de validación/saneamiento por endpoint |
| `src/utils/` | JWT, bcrypt, precios, saneamiento, serializers, errores |
| `public/` | Frontend multipágina, estilos y módulos JS |
| `tests/` | Pruebas unitarias e integración |

## 4. Patrones de diseño aplicados

### 4.1 Repository Pattern

`user.repository.js`, `product.repository.js` y `order.repository.js` encapsulan todo el SQL. Los servicios nunca escriben consultas directamente, lo que facilita cambiar SQLite por PostgreSQL sin tocar la lógica de negocio.

Ejemplo: `orderRepository.create()` ejecuta una transacción que inserta el pedido, sus líneas y descuenta stock de forma atómica.

### 4.2 Factory Pattern (pagos)

```
order.service
   └── createPaymentProvider(env.paymentProvider)
          ├── MockPaymentProvider   (aprobación inmediata)
          └── StripePaymentProvider (Payment Intents real)
```

El servicio de pedidos desconoce los detalles de cada pasarela; solo consume la interfaz `createPayment()`.

### 4.3 Middleware (cadena de responsabilidad)

Cada petición atraviesa: Helmet → CORS → parser JSON → rate limit → router → `authenticate` → `authorize` → validadores → controlador → manejador de errores.

### 4.4 MVC adaptado a API

No hay vistas del lado del servidor: los controladores actúan como capa de presentación HTTP y el frontend consume JSON. La separación `controller → service → repository` mantiene el controlador delgado.

## 5. Flujo de una petición

### Registro (`POST /api/v1/auth/register`)

1. `authLimiter` aplica el límite anti fuerza bruta.
2. `registerValidator` valida nombre, correo, contraseña y sanea textos.
3. `validate` transforma errores en `400 VALIDATION_ERROR`.
4. `authController.register` llama a `authService.register`.
5. El servicio verifica duplicados, hashea con bcrypt y crea el usuario.
6. Devuelve `{ user, token }`; el frontend guarda el token en `localStorage`.

### Creación de pedido (`POST /api/v1/orders`)

1. `authenticate` valida el JWT y recarga el usuario desde SQLite.
2. `createOrderValidator` valida ítems, cantidades, dirección, pago y coordenadas.
3. `orderService.createOrder`:
   - Agrupa ítems repetidos.
   - Lee precios y stock **desde la base de datos** (nunca confía en el cliente).
   - Calcula subtotal, envío y total en centavos.
   - Si hay ubicación, consulta clima y ETA (con fallback).
   - `orderRepository.create` abre una transacción y descuenta stock.
   - Procesa el pago con la factory; si falla, cancela el pedido y restaura stock.
4. Responde `201` con el pedido y el resultado del pago.

## 6. Modelo de datos

```
users 1 ──────── * orders 1 ──────── * order_items * ──────── 1 products
  id                 id                    id                     id
  name               user_id               order_id               name
  email (unique)     status                product_id             category
  password_hash      subtotal_cents        product_name           price_cents
  role               delivery_fee_cents    product_image          stock
  created_at         total_cents           unit_price_cents       featured
                     payment_method        quantity               active
                     payment_status        line_total_cents
                     delivery_address
                     eta_minutes
                     weather
                     created_at
```

- Importes en **centavos** (`INTEGER`) para evitar errores de punto flotante.
- `order_items` guarda una **copia histórica** del nombre, imagen y precio del producto.
- `CHECK` constraints en estados, roles, cantidades y precios.
- Claves foráneas activas (`PRAGMA foreign_keys = ON`).
- Índices en `orders.user_id`, `orders.created_at`, `order_items.order_id` y `products.category`.

## 7. Seguridad

| Amenaza | Mitigación | Implementación |
| --- | --- | --- |
| Robo de contraseñas | Hash bcrypt con salt | `src/utils/password.js` |
| Sesiones falsificadas | JWT firmado con expiración e issuer | `src/utils/jwt.js` |
| Escalada de privilegios | Middleware de roles | `src/middlewares/auth.middleware.js` |
| Fuerza bruta | Rate limit global y estricto en auth | `src/middlewares/rateLimit.middleware.js` |
| Inyección SQL | Consultas preparadas y parámetros | Repositorios |
| XSS almacenado | Saneamiento de entradas + `textContent` en el frontend | `sanitizeText`, `ui.js` |
| XSS reflejado | JSON escapado (`json escape`) + CSP | `src/app.js`, Helmet |
| Clickjacking | `frame-ancestors 'none'` | Helmet |
| MIME sniffing | `X-Content-Type-Options: nosniff` | Helmet |
| CORS abierto | Lista blanca de orígenes | `CORS_ORIGINS` |
| Fuga de datos | Mensajes genéricos, 404 para recursos ajenos | Servicios/controladores |
| Fuerza bruta de login | Mensaje idéntico para usuario/clave inválidos | `auth.service.js` |

## 8. Integraciones externas

### Stripe

- `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY`.
- Se crea un **Payment Intent** con `amount`, `currency`, `description` y `metadata` (orderId, userId).
- Se usa `Idempotency-Key` por pedido.
- Estados mapeados: `succeeded → paid`, `canceled → failed`, resto → `pending`.
- Si falla, el pedido se cancela y el stock se restaura.
- Con `PAYMENT_PROVIDER=mock` se simula la aprobación para la demo.

### OpenWeatherMap

- `OPENWEATHER_API_KEY` opcional.
- `GET /api/v1/delivery/estimate?lat=&lon=` consulta clima actual (`units=metric`, `lang=es`).
- Caché en memoria de 10 minutos por coordenada redondeada.
- Timeout de 4 s y **fallback simulado** si no hay clave o la API falla.
- El ETA base (25 min) se ajusta según lluvia, tormenta, nieve, niebla, etc.

## 9. Estrategia de pruebas

| Tipo | Herramienta | Cobertura |
| --- | --- | --- |
| Unitarias | Jest | Cálculo de totales, bcrypt, JWT, saneamiento, factory de pagos, merge de ítems |
| Integración | Jest + Supertest | Registro/login, JWT, catálogo, filtros, pedidos, stock, ownership, roles, clima |
| Base de datos | SQLite `:memory:` | Aislamiento total y velocidad |
| CI | GitHub Actions | Lint + tests + verificación de CSS |

Las pruebas de integración reinician el esquema y el seed antes de cada caso (`resetDatabase`), por lo que son deterministas y no dependen de archivos locales.

## 10. Decisiones y limitaciones

- **SQLite** simplifica la demo y el despliegue; para producción con alta concurrencia se recomienda PostgreSQL.
- **Frontend sin framework** demuestra fundamentos de HTML/CSS/JS y reduce el build; el CSS de Tailwind se compila y versiona.
- **Pago simulado** por defecto para que la demo funcione sin claves; Stripe real requiere configurar claves y completar la confirmación en el cliente (Stripe.js).
- **Sin endpoint de cancelación** de pedidos por parte del usuario (solo cancelación automática por fallo de pago); queda como trabajo futuro.
- **Notificaciones** y seguimiento en tiempo real con WebSockets quedan fuera del alcance de esta evaluación.
