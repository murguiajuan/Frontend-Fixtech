# FIXTECH — Frontend

SPA Angular 22 para FIXTECH, la plataforma que conecta clientes con técnicos verificados en
Piura. Este repositorio contiene únicamente el frontend; consume la API REST del backend
FIXTECH en `http://localhost:8082/api`.

## Estado actual

Fases 0, 1, 2 y 3 completadas: base técnica, autenticación JWT, sesión, guards, interceptores,
layouts por rol, panel inicial, administración de técnicos y usuarios, registro de técnico con
catálogos y perfil con estado de verificación. Las demás pantallas de negocio se incorporan en
las siguientes fases. El plan completo y el progreso están en
[`PLAN_FRONTEND.md`](./PLAN_FRONTEND.md).

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
E2E_BACKEND=1 npm run e2e
```

La prueba de aprobación crea un técnico único mediante `POST /api/auth/register/tecnico`, inicia
sesión como administrador, aprueba el perfil y comprueba el estado con
`GET /api/admin/tecnicos`. La prueba de registro de técnico crea otra cuenta única desde la
interfaz, inicia sesión y verifica el perfil en estado `PENDIENTE`. Requiere el backend y MySQL
locales. Sin `E2E_BACKEND=1` esas pruebas se omiten y solo corren las pruebas públicas. No existe
un endpoint para limpiar las cuentas creadas por las pruebas.

## Estructura

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/          # Sesión, AuthService, refresh, interceptores y guards
│   │   ├── catalogos/     # Catálogos públicos de especialidades y distritos
│   │   ├── http/          # Normalización de errores de API
│   │   ├── layout/        # Layout público y layout privado con sidenav
│   │   └── models/        # Etiquetas y tipos compartidos
│   ├── features/
│   │   ├── admin/         # Verificación de técnicos y gestión de usuarios
│   │   ├── auth/          # Login, registro de cliente y registro de técnico
│   │   ├── dashboard/     # Panel inicial por rol
│   │   ├── errors/        # Páginas 403 y 404
│   │   └── tecnico/       # Perfil del técnico y estado de verificación
│   ├── shared/ui/         # Marca, badges, iconos y notificaciones
│   ├── app.config.ts      # Locale es-PE, router y HttpClient con interceptores
│   └── app.routes.ts      # Rutas públicas y privadas con lazy loading
├── environments/          # URLs de API por entorno
├── styles.scss            # Tema Material, tokens y utilidades globales
└── index.html
e2e/                       # Pruebas Playwright y Axe
```

## Roles y navegación

| Rol       | Acceso inicial | Navegación habilitada                                                    |
| --------- | -------------- | ------------------------------------------------------------------------ |
| `CLIENTE` | `/app/inicio`  | Inicio; solicitudes y servicios aparecen como “Próximamente”             |
| `TECNICO` | `/app/inicio`  | Inicio y mi perfil; ofertas bloqueadas si no está aprobado o tiene deuda |
| `ADMIN`   | `/app/inicio`  | Inicio, técnicos y usuarios; reportes y catálogos como “Próximamente”    |

Los guards protegen las rutas privadas:

- `authGuard`: exige sesión y restaura el perfil desde `GET /api/auth/me`.
- `guestGuard`: impide que un usuario autenticado vuelva al login.
- `roleGuard`: valida los roles declarados en `data.roles`.
- `tecnicoAprobadoGuard`: bloquea solicitudes/ofertas de técnicos no aprobados.

## Panel administrativo

- `/app/admin/tecnicos`: listado con filtros por estado de verificación y búsqueda. El detalle
  expandible muestra contacto, modalidades, calificación, reseñas, servicios, saldo, bloqueo por
  deuda y fechas. La verificación usa `PATCH /api/admin/tecnicos/{id}/verificacion`; observar o
  rechazar exige un motivo de hasta 300 caracteres y confirmación explícita.
- `/app/admin/usuarios`: listado con filtros por rol, estado y búsqueda. Permite suspender o
  reactivar cuentas con `PATCH /api/admin/usuarios/{id}/estado`. Suspender exige motivo y
  confirmación; reactivar no. Las cuentas `ADMIN` y la cuenta propia están protegidas en la
  interfaz y el backend responde `403` si se intenta cambiar su estado.
- Los errores `409` y `403` se muestran dentro del diálogo y el listado se recarga tras cada
  cambio exitoso.

> Brecha: la API de administración no expone documentos de verificación. El detalle lo indica
> explícitamente y no inventa documentos ni campos.

## Registro y perfil de técnico

- `/registro-tecnico` es público y crea la cuenta con `POST /api/auth/register/tecnico`. Carga
  `GET /api/catalogos/especialidades` y `GET /api/catalogos/distritos` con estados de carga,
  error con reintento y vacío.
- El formulario valida los mismos límites del backend: nombres y apellidos de hasta 80
  caracteres, correo de hasta 120, celular `9XXXXXXXX`, DNI de 8 dígitos, contraseña de 8 a 72,
  descripción de hasta 1000, experiencia entera de 0 a 60, dirección y referencia de taller de
  hasta 200 y horario de hasta 120.
- Exige al menos una modalidad y una dirección de taller cuando se ofrece atención en taller.
  También exige al menos una especialidad y un distrito. Los campos de taller se ocultan y se
  limpian cuando no aplican.
- El registro responde `201` sin tokens; la aplicación redirige al login con un aviso para que el
  técnico inicie sesión por separado.
- `/app/tecnico/perfil` es de solo lectura y muestra identidad, estado de verificación, motivo,
  modalidades, descripción, experiencia, calificación, reseñas, servicios completados y bloqueo
  por deuda. Incluye mensajes específicos para `PENDIENTE`, `APROBADO`, `OBSERVADO` y `RECHAZADO`.
- La edición de perfil, foto y documentos no está disponible porque la API no expone esos
  endpoints. El perfil tampoco puede mostrar DNI, celular, especialidades, distritos ni datos del
  taller porque `GET /api/auth/me` no los devuelve.

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
ofrece esas pantallas ni promete esas funciones. Para técnicos, `GET /api/auth/me` tampoco
devuelve DNI, celular, especialidades, distritos ni datos del taller; el perfil solo muestra los
campos disponibles.

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
móvil de 360 px. La interfaz es mobile-first, con foco visible, etiquetas explícitas y mensajes
de error anunciados. Las pantallas y diálogos de las fases 2 y 3 también se auditan; los iconos
de los botones con `aria-label` se renderizan como SVG decorativos para no mezclar ligaduras de
fuentes con el nombre accesible.

## Despliegue

El build de producción genera una SPA en `dist/fixtech-frontend/browser`. El servidor debe:

1. Servir `index.html` para cualquier ruta no encontrada (fallback de SPA).
2. Proxyear `/api` al backend FIXTECH.
3. Enviar cabeceras de seguridad y cachear los archivos con hash de forma agresiva.

Los detalles de despliegue y el checklist de aceptación se completan en la Fase 12.
