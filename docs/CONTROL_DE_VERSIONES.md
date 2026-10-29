# Control de versiones · FoodExpress

Documentación de la **Parte 1** del caso de estudio: justificación de plataformas, flujo de trabajo, configuración y protección de ramas.

---

## 1. Justificación de las plataformas y herramientas

### 1.1 Git (control de versiones distribuido)

- **Historial completo y distribuido:** cada clon contiene todo el historial, lo que permite trabajar sin conexión y recuperar cualquier versión.
- **Ramas baratas y rápidas:** facilita el desarrollo paralelo de funcionalidades sin afectar `main`.
- **Trazabilidad:** cada commit registra autor, fecha y motivo del cambio, lo que simplifica auditorías y revisiones.
- **Integración con CI/CD:** los eventos de Git (push, pull request) disparan pruebas y despliegues automatizados.

### 1.2 GitHub / GitLab (alojamiento, revisión y CI/CD)

- **Repositorio centralizado:** punto único de verdad para el equipo.
- **Pull/Merge Requests:** revisión de código obligatoria antes de integrar cambios.
- **Issues y tableros:** gestión de tareas con metodología Scrum/Kanban.
- **GitHub Actions / GitLab CI:** ejecución automática de linter y pruebas.
- **Protección de ramas:** evita pushes directos a `main` y exige checks en verde.

### 1.3 GitKraken / Extensión Git de VS Code (herramientas visuales)

- **Visualización del árbol de commits y ramas:** auditorías rápidas y comprensión del historial.
- **Resolución asistida de conflictos:** interfaz gráfica para merge conflicts.
- **Integración con GitHub/GitLab:** gestión de PR, issues y revisiones sin salir del editor.

---

## 2. Flujo de trabajo: GitHub Flow

Se adopta **GitHub Flow** por su agilidad en proyectos web:

1. **`main`** siempre estable y desplegable. Cada commit en `main` debe pasar lint y pruebas.
2. Se crea una rama corta desde `main`:
   - `feature/<nombre>` para funcionalidades: `feature/autenticacion-jwt`, `feature/integracion-stripe`.
   - `fix/<nombre>` para correcciones: `fix/calculo-envio`.
   - `docs/<nombre>` y `chore/<nombre>` para documentación e infraestructura.
3. Se desarrolla con commits pequeños siguiendo **Conventional Commits**:
   - `feat: agregar endpoint de historial de pedidos`
   - `fix: validar stock antes de crear la orden`
   - `docs: documentar variables de entorno`
   - `test: cubrir login con credenciales inválidas`
4. Se abre un **Pull Request** hacia `main` usando la plantilla del repositorio.
5. El PR requiere:
   - Al menos **una revisión aprobada**.
   - **Checks de CI en verde** (`npm run lint`, `npm test`, build de CSS).
   - Sin conflictos con `main`.
6. Se integra con **Squash and merge** para mantener un historial limpio.
7. Se elimina la rama remota tras el merge.
8. Para releases: etiqueta semántica (`v1.0.0`) y despliegue.

### Comandos típicos

```bash
# Actualizar main
git checkout main
git pull origin main

# Nueva funcionalidad
git checkout -b feature/checkout-tarjeta
git add .
git commit -m "feat: agregar checkout con tarjeta"
git push -u origin feature/checkout-tarjeta

# Después del merge
git checkout main
git pull origin main
git branch -d feature/checkout-tarjeta
```

---

## 3. Configuración del repositorio

### 3.1 Archivo `.gitignore`

El repositorio incluye un `.gitignore` que excluye dependencias (`node_modules/`), secretos (`.env`), base de datos local (`data/`, `*.db`), logs, cobertura y archivos de IDE. Se conserva `.env.example` como plantilla.

### 3.2 Protección de la rama `main` (GitHub)

En **Settings → Branches → Branch protection rules**:

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Checks requeridos: `CI / lint-and-test`
- [x] **Do not allow bypassing the above settings**
- [x] Restringir force pushes y borrado de la rama
- [x] **Require conversation resolution before merging**

En **GitLab** el equivalente es *Settings → Repository → Protected branches* con "Allowed to merge: Maintainers" y *Merge request approvals* activados.

### 3.3 Integración continua

El workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) se ejecuta en cada push a `main` y en cada Pull Request:

1. Instala dependencias con `npm ci`.
2. Ejecuta ESLint (`npm run lint`).
3. Ejecuta Jest + Supertest (`npm test`).
4. Compila Tailwind y verifica que el CSS versionado esté actualizado.

### 3.4 Plantilla de Pull Request

`.github/PULL_REQUEST_TEMPLATE.md` incluye checklist de pruebas, seguridad, documentación y variables de entorno.

---

## 4. Enlace del repositorio

- **Repositorio:** `https://github.com/tu-usuario/foodexpress-app` *(reemplazar por la URL real)*
- **Demo / producción:** `https://foodexpress-demo.onrender.com` *(reemplazar tras el despliegue)*
- **Rama principal:** `main`
- **Convención de commits:** Conventional Commits
- **Versionado:** SemVer (`MAJOR.MINOR.PATCH`)

---

## 5. Estrategia de ramas para esta entrega

| Rama | Propósito |
| --- | --- |
| `main` | Código estable y desplegable |
| `feature/foodexpress-app` | Implementación inicial de la plataforma (si se trabaja con PR) |
| `feature/autenticacion-jwt` | Registro, login y middleware JWT |
| `feature/catalogo-pedidos` | Catálogo, carrito y API de pedidos |
| `feature/integracion-stripe` | Factory de pagos y Stripe Payment Intents |
| `feature/clima-eta` | OpenWeatherMap y estimación de entrega |
| `fix/*` | Correcciones puntuales |

---

## 6. Buenas prácticas adoptadas

- Commits atómicos y con mensaje en imperativo.
- Nunca se versionan secretos: `.env` está ignorado.
- Los cambios de esquema o variables se documentan en el PR.
- Las pruebas deben pasar antes del merge.
- El CSS compilado se versiona para que `npm start` funcione sin build adicional.
- Revisión obligatoria de al menos otra persona (o revisión propia documentada en proyectos individuales).
