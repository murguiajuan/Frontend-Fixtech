# FIXTECH — Frontend

SPA Angular 22 para FIXTECH, la plataforma que conecta clientes con técnicos verificados en
Piura. Este repositorio contiene únicamente el frontend; consume la API REST del backend
FIXTECH en `http://localhost:8082/api`.

## Estado actual

Fases 0 y 1 completadas: base técnica, autenticación JWT, sesión, guards, interceptores,
layouts por rol y panel inicial. Las pantallas de negocio se incorporan en las siguientes
fases. El plan completo y el progreso están en [`PLAN_FRONTEND.md`](./PLAN_FRONTEND.md).

## Stack

- Angular 22 con componentes standalone, signals y control de flujo `@if` / `@for`.
- TypeScript estricto y `strictTemplates`.
- SCSS y Angular Material 22 con tokens propios de FIXTECH.
- Vitest para pruebas unitarias.
- Playwright y `@axe-core/playwright` para E2E y accesibilidad.
- ESLint (`angular-eslint`) y Prettier.
- SPA pura: sin SSR, sin hidratación y sin `isPlatformBrowser`.

## Requisitos

- Node.js 22.23.4 (ver `.nvmrc`).
- npm 10 o superior.
- Backend FIXTECH local en `http://localhost:8082` para flujos reales de autenticación.
- MySQL con el esquema `db/fixtech_db.sql` del backend.

```bash
source ~/.nvm/nvm.sh
nvm use
npm install
```

## Desarrollo

```bash
npm start
```

La aplicación queda disponible en `http://localhost:4200`. El entorno de desarrollo apunta a
`http://localhost:8082/api` (`src/environments/environment.ts`).

Para levantar el backend:

```bash
cd /home/juan/IdeaProjects/CalidadSoftware
./mvnw spring-boot:run
```

Credenciales de desarrollo del administrador: `admin@fixtech.pe` / `Admin123!`.

## Comandos

| Comando                | Descripción                                    |
| ---------------------- | ---------------------------------------------- |
| `npm start`            | Servidor de desarrollo en el puerto 4200       |
| `npm run build`        | Build de producción en `dist/fixtech-frontend` |
| `npm test`             | Pruebas unitarias con Vitest (una ejecución)   |
| `npm run test:watch`   | Pruebas unitarias en modo interactivo          |
| `npm run lint`         | ESLint sobre TypeScript y plantillas           |
| `npm run format`       | Aplica Prettier                                |
| `npm run format:check` | Verifica el formato sin modificar archivos     |
| `npm run e2e`          | Playwright en escritorio y móvil de 360 px     |
| `npm run e2e:ui`       | Interfaz interactiva de Playwright             |

El login real contra el backend local se ejecuta con:

```bash
E2E_BACKEND=1 npm run e2e -- --project=chromium
```

Sin `E2E_BACKEND=1` esa prueba se omite y solo corren las pruebas públicas.

## Estructura

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/          # Sesión, AuthService, refresh, interceptores y guards
│   │   ├── http/          # Normalización de errores de API
│   │   ├── layout/        # Layout público y layout privado con sidenav
│   │   └── models/        # Etiquetas y tipos compartidos
│   ├── features/
│   │   ├── auth/          # Login y registro de cliente
│   │   ├── dashboard/     # Panel inicial por rol
│   │   └── errors/        # Páginas 403 y 404
│   ├── shared/ui/         # Marca, notificaciones y componentes reutilizables
│   ├── app.config.ts      # Locale es-PE, router y HttpClient con interceptores
│   └── app.routes.ts      # Rutas públicas y privadas con lazy loading
├── environments/          # URLs de API por entorno
├── styles.scss            # Tema Material, tokens y utilidades globales
└── index.html
e2e/                       # Pruebas Playwright y Axe
```

## Roles y navegación

| Rol       | Acceso inicial | Navegación habilitada                                        |
| --------- | -------------- | ------------------------------------------------------------ |
| `CLIENTE` | `/app/inicio`  | Inicio; solicitudes y servicios aparecen como “Próximamente” |
| `TECNICO` | `/app/inicio`  | Inicio; ofertas bloqueadas si no está aprobado o tiene deuda |
| `ADMIN`   | `/app/inicio`  | Inicio; técnicos y usuarios aparecen como “Próximamente”     |

Los guards protegen las rutas privadas:

- `authGuard`: exige sesión y restaura el perfil desde `GET /api/auth/me`.
- `guestGuard`: impide que un usuario autenticado vuelva al login.
- `roleGuard`: valida los roles declarados en `data.roles`.
- `tecnicoAprobadoGuard`: bloquea solicitudes/ofertas de técnicos no aprobados.

## Autenticación

1. `POST /api/auth/login` devuelve `accessToken`, `refreshToken` y `expiraEnSegundos`.
2. Los tokens se guardan en `sessionStorage` mediante `SessionStore`.
3. `GET /api/auth/me` carga el perfil y, para técnicos, el estado de verificación, el motivo,
   el bloqueo por deuda, el saldo pendiente y las modalidades.
4. `authInterceptor` agrega `Authorization: Bearer <token>` a las llamadas a la API.
5. Ante un `401`, se renueva el token una sola vez con `POST /api/auth/refresh` y se reintenta
   la solicitud. Si el refresh falla, se limpia la sesión.
6. `errorInterceptor` normaliza los errores del backend en `ApiError` y muestra notificaciones
   para fallos de red o de servidor.

### Limitación conocida

`sessionStorage` aísla la sesión por pestaña y la elimina al cerrar la pestaña. Es una decisión
del MVP; para producción se recomienda migrar a cookies `HttpOnly` con `SameSite` y protección
CSRF. Esta limitación debe revisarse antes del despliegue.

## API y entornos

- Desarrollo: `http://localhost:8082/api` (`environment.ts`).
- Producción: `/api` (`environment.prod.ts`), pensado para servir la SPA detrás de un proxy
  inverso que enrute `/api` al backend.
- El backend debe permitir el origen del frontend en CORS. En local se aceptan
  `http://localhost:4200` y `http://127.0.0.1:4200`.
- La fuente de verdad de los contratos es Swagger/OpenAPI del backend. No se agregan endpoints
  ni campos que no existan en la API.

### Brechas de API

No existen todavía endpoints para carga de documentos de verificación, edición de perfil o
foto, recuperación/cambio de contraseña ni búsqueda pública de técnicos. Por eso el frontend no
ofrece esas pantallas ni promete esas funciones.

## Calidad y accesibilidad

Cada fase debe cerrar con build, pruebas, lint y formato en verde:

```bash
npm run build
npm test
npm run lint
npm run format:check
npm run e2e
```

Las pruebas E2E incluyen Axe con las reglas WCAG 2.0/2.1 A y AA en escritorio y en un viewport
móvil de 360 px. La interfaz es mobile-first, con foco visible, etiquetas explícitas y
mensajes de error anunciados.

## Despliegue

El build de producción genera una SPA en `dist/fixtech-frontend/browser`. El servidor debe:

1. Servir `index.html` para cualquier ruta no encontrada (fallback de SPA).
2. Proxyear `/api` al backend FIXTECH.
3. Enviar cabeceras de seguridad y cachear los archivos con hash de forma agresiva.

Los detalles de despliegue y el checklist de aceptación se completan en la Fase 12.
