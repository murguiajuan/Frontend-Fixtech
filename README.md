# FIXTECH — Frontend

SPA Angular 22 para FIXTECH, la plataforma que conecta clientes con técnicos verificados en
Piura. Este repositorio contiene únicamente el frontend; consume la API REST del backend
FIXTECH en `http://localhost:8082/api`.

## Estado actual

Fases 0, 1, 2, 3, 4, 5 y 6 completadas: base técnica, autenticación JWT, sesión, guards,
interceptores, layouts por rol, panel inicial, administración de técnicos y usuarios, registro y
perfil editable del técnico con foto autorizada, solicitudes del cliente con fotos, listado,
detalle, edición y cancelación, solicitudes disponibles y ofertas del técnico, negociación, y
servicios con aceptación, avances, mensajería, ajustes de precio, finalización y conformidad. Las
demás pantallas de negocio se incorporan en las siguientes fases. El plan completo y el progreso
están en [`PLAN_FRONTEND.md`](./PLAN_FRONTEND.md).

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
interfaz, inicia sesión, verifica el perfil en estado `PENDIENTE` y comprueba la edición y la foto.
La prueba de solicitudes registra un cliente único, publica una solicitud con foto, la edita, la
cancela y la busca en “Mis solicitudes”. La prueba de servicios recorre el flujo completo:
aceptación directa de una oferta, PIN de inicio, diagnóstico con foto, mensajería, ajuste de precio,
finalización y conformidad. Requiere el backend y MySQL locales. Sin `E2E_BACKEND=1` esas pruebas
se omiten y solo corren las públicas. No existe un endpoint para limpiar las cuentas y solicitudes
creadas por las pruebas.

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
│   │   ├── cliente/       # Solicitudes: creación, listado, detalle, edición y cancelación
│   │   ├── dashboard/     # Panel inicial por rol
│   │   ├── errors/        # Páginas 403 y 404
│   │   ├── ofertas/       # Ofertas, negociación, comparación y aceptación
│   │   ├── servicios/     # Ejecución: avances, mensajes, ajustes y conformidad
│   │   └── tecnico/       # Perfil editable del técnico, foto y estado de verificación
│   ├── shared/ui/         # Marca, badges, iconos, notificaciones e imágenes autenticadas
│   ├── app.config.ts      # Locale es-PE, router y HttpClient con interceptores
│   └── app.routes.ts      # Rutas públicas y privadas con lazy loading
├── environments/          # URLs de API por entorno
├── styles.scss            # Tema Material, tokens y utilidades globales
└── index.html
e2e/                       # Pruebas Playwright y Axe
```

## Roles y navegación

| Rol       | Acceso inicial | Navegación habilitada                                                                                 |
| --------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `CLIENTE` | `/app/inicio`  | Inicio, nueva solicitud, mis solicitudes y mis servicios; ofertas y negociación en el detalle   |
| `TECNICO` | `/app/inicio`  | Inicio, mi perfil, solicitudes disponibles, mis ofertas y mis servicios; bloqueado si no está aprobado o tiene deuda |
| `ADMIN`   | `/app/inicio`  | Inicio, técnicos y usuarios; reportes y catálogos como “Próximamente”                                 |

Los guards protegen las rutas privadas:

- `authGuard`: exige sesión y restaura el perfil desde `GET /api/auth/me`.
- `guestGuard`: impide que un usuario autenticado vuelva al login.
- `roleGuard`: valida los roles declarados en `data.roles`.
- `tecnicoAprobadoGuard`: bloquea solicitudes y ofertas de técnicos no aprobados o con deuda
  pendiente; usa `auth.puedeOfertar()` sobre el perfil cargado desde `GET /api/auth/me`.

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
- `/app/tecnico/perfil` muestra identidad, estado de verificación, motivo, modalidades,
  descripción, experiencia, calificación, reseñas, servicios completados, bloqueo por deuda, DNI,
  celular, especialidades, distritos y datos del taller. Incluye mensajes específicos para
  `PENDIENTE`, `APROBADO`, `OBSERVADO` y `RECHAZADO`.
- La edición usa `PUT /api/perfil/tecnico` con datos personales y profesionales. Al guardar, el
  backend vuelve la verificación a `PENDIENTE` y limpia motivo, verificador y fecha; la interfaz
  avisa de ese efecto antes de confirmar.
- La foto se sube con `POST /api/perfil/foto` (multipart, campo `foto`) y se muestra con
  `GET /api/tecnicos/{id}/foto`, que exige JWT. Cambiar la foto no reinicia la verificación.
- La API valida DNI de 8 dígitos, celular `9XXXXXXXX`, especialidades y distritos, al menos una
  modalidad y los datos del taller cuando corresponde.

> Brecha: los documentos de verificación siguen sin flujo administrativo porque
> `documento_tecnico` no tiene controlador expuesto. El perfil no inventa documentos. Tampoco
> existen endpoints de cambio o recuperación de contraseña.

## Solicitudes del cliente

- `/app/cliente/solicitudes` lista `GET /api/solicitudes/mias` con filtro `estado` y paginación
  visual de seis elementos; incluye estados de carga, error con reintento y vacío.
- `/app/cliente/solicitudes/nueva` crea con `POST /api/solicitudes` multipart: `datos` JSON y
  `fotos` (1 a 5 imágenes JPG/PNG de hasta 5 MB). Carga tipos de equipo, tipos de servicio y
  distritos desde `/api/catalogos/*`.
- `/app/cliente/solicitudes/{id}` muestra el detalle, las fotos y el motivo de cancelación. Solo
  `PUBLICADA` permite editar y solo `PUBLICADA` o `CON_OFERTAS` permite cancelar; el diálogo de
  cancelación acepta un motivo opcional de hasta 300 caracteres.
- `/app/cliente/solicitudes/{id}/editar` usa `PUT /api/solicitudes/{id}` y actualiza solo los
  datos; las fotos solo se adjuntan al crear.
- Las imágenes se descargan como blob con JWT desde
  `GET /api/solicitudes/{id}/imagenes/{imagenId}`; nunca se enlazan como URL pública.
- La validación de archivos rechaza tipos distintos de JPG/PNG, archivos de más de 5 MB y más de
  cinco fotos antes de enviar.

## Solicitudes y ofertas del técnico

- `/app/tecnico/solicitudes` lista `GET /api/solicitudes/disponibles` con búsqueda local por
  equipo, servicio o distrito y paginación visual de seis elementos. Marca las solicitudes que ya
  tienen una oferta propia consultando `GET /api/ofertas/mias`.
- `/app/tecnico/solicitudes/{id}` muestra el detalle de una solicitud compatible, la oferta propia,
  su historial de negociación y las acciones de editar o retirar. El detalle deja de estar
  disponible cuando `GET /api/solicitudes/disponibles/{id}` responde `403`.
- `/app/tecnico/solicitudes/{id}/ofertar` crea una oferta con `POST /api/solicitudes/{id}/ofertas`:
  modalidad, precio del servicio, movilidad, diagnóstico, tiempo estimado, garantía y mensaje. La
  movilidad debe ser `0` en taller y no superar el tope del distrito en domicilio.
- `/app/tecnico/ofertas/{id}/editar` actualiza con `PUT /api/ofertas/{id}` solo ofertas `ENVIADA` o
  `CONTRAOFERTADA`; retirar usa `DELETE /api/ofertas/{id}` y exige confirmación.
- `/app/tecnico/ofertas` lista `GET /api/ofertas/mias` con filtros por estado, métricas, paginación
  y respuesta a contraofertas. Las ofertas activas muestran edición y retiro; las cerradas, su
  resultado.
- El cliente ve las ofertas en el detalle de su solicitud: `GET /api/solicitudes/{id}/ofertas`
  permite ordenar por precio, calificación o tiempo; `GET .../ofertas/comparar?ids=` compara hasta
  tres; y `POST /api/ofertas/{id}/contraoferta` registra contraofertas, aceptaciones o rechazos.
- Aceptar una contraoferta del técnico desde el cliente crea el servicio y cierra el resto de
  ofertas. La aceptación directa de una oferta normal usa `POST /api/ofertas/{id}/aceptar`, muestra
  una confirmación y navega al detalle del servicio creado.
- `precioTotal` y `montoTotal` ya excluyen `costoDiagnostico`; la interfaz muestra el diagnóstico
  por separado y nunca lo suma al total.
- Todas las rutas del técnico usan `roleGuard` y `tecnicoAprobadoGuard`, con estados de carga,
  error con reintento y vacío.

## Servicios

- `/app/cliente/servicios` y `/app/tecnico/servicios` listan `GET /api/servicios/mios` con filtros
  por estado (en curso, por confirmar, cerrados, cancelados), contadores, carga, error y vacío.
- `/app/{rol}/servicios/{id}` muestra `GET /api/servicios/{id}`: estado, modalidad, fechas, montos,
  datos de contacto, PIN de inicio en domicilio, historial de estados y constancias.
- El técnico cambia el estado con `PATCH /api/servicios/{id}/estado`: inicia el traslado, valida el
  PIN de 4 dígitos para pasar a `EN_PROCESO`, registra el diagnóstico y reanuda el trabajo.
- Los avances se registran con `POST /api/servicios/{id}/avances` (multipart, foto opcional
  JPG/PNG de hasta 5 MB) y se muestran con `GET .../avances` y `GET .../avances/{avanceId}/foto`.
- La mensajería usa `GET/POST /api/servicios/{id}/mensajes`; la conversación se carga al abrir el
  detalle y se actualiza con el botón “Actualizar”, sin polling ni tiempo real.
- El técnico propone un ajuste con `POST /api/servicios/{id}/ajuste-precio` (justificación y
  evidencia opcional); el cliente aprueba o rechaza con `PATCH /api/ajustes/{id}/respuesta`.
  Aprobar actualiza el monto y devuelve el servicio a `EN_DIAGNOSTICO`; rechazar lo cancela.
- La finalización usa `POST /api/servicios/{id}/finalizar` con el `montoTotal` exacto y el método
  de pago elegido. El cliente confirma con `POST /api/servicios/{id}/conformidad`.
- El total y el monto final excluyen `costoDiagnostico`; el diagnóstico se muestra aparte.
- El flujo de taller queda bloqueado hasta la Fase 7: sin constancia de recepción no se inicia y
  sin constancia de entrega no se finaliza. El detalle muestra avisos y no ofrece esas acciones.

> Brecha: la API permite registrar constancias de recepción y entrega, pero sus pantallas
> pertenecen a la Fase 7. La mensajería no tiene actualización en tiempo real.

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

No existen todavía endpoints para carga de documentos de verificación, recuperación/cambio de
contraseña ni búsqueda pública de técnicos. La edición de perfil y la foto del técnico ya están
cubiertas por `PUT /api/perfil/tecnico`, `POST /api/perfil/foto` y `GET /api/tecnicos/{id}/foto`.
Para clientes no existe un endpoint de limpieza de solicitudes creadas por pruebas. El contrato de
ofertas tampoco incluye el resumen de la solicitud en `OfertaResponse` ni una consulta directa de
la oferta propia por solicitud, y el detalle disponible deja de responder cuando la solicitud deja
de ser compatible.

El registro completo, el impacto y la decisión provisional de cada brecha están en
[`BRECHAS_PENDIENTES.md`](./BRECHAS_PENDIENTES.md). Se resolverán al final del proyecto.

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
de error anunciados. Las pantallas y diálogos de las fases 2 a 5 también se auditan; los iconos
de los botones con `aria-label` se renderizan como SVG decorativos para no mezclar ligaduras de
fuentes con el nombre accesible.

## Despliegue

El build de producción genera una SPA en `dist/fixtech-frontend/browser`. El servidor debe:

1. Servir `index.html` para cualquier ruta no encontrada (fallback de SPA).
2. Proxyear `/api` al backend FIXTECH.
3. Enviar cabeceras de seguridad y cachear los archivos con hash de forma agresiva.

Los detalles de despliegue y el checklist de aceptación se completan en la Fase 12.
