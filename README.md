# FIXTECH — Frontend

SPA Angular 22 para FIXTECH, la plataforma que conecta clientes con técnicos verificados en
Piura. Este repositorio contiene únicamente el frontend; consume la API REST del backend
FIXTECH en `http://localhost:8082/api`.

## Estado actual

Fases 0 a 12 completadas: base técnica, autenticación JWT, sesión, guards, interceptores, layouts
por rol, panel inicial, administración de técnicos y usuarios, registro y perfil editable del
técnico con foto autorizada, solicitudes del cliente con fotos, listado, detalle, edición y
cancelación, solicitudes disponibles y ofertas del técnico, negociación, servicios con aceptación,
avances, mensajería, ajustes de precio, finalización y conformidad, constancias de taller con
fotos, reseñas con respuesta y moderación, reclamos con seguimiento administrativo, comisiones del
técnico con pagos, comprobantes y validación administrativa, administración de catálogos,
parámetros del sistema, dashboard, reportes con exportación Excel y auditoría, centro de
notificaciones con badge, polling, perfil de cuenta de solo lectura y cierre de sesión por
expiración con aviso accesible, endurecimiento de UX, rendimiento y seguridad, y cierre de calidad
con despliegue verificado y documentación de aceptación. La Fase 1 de cierre de brechas agrega la
recuperación de contraseña mediante código OTP. El plan completo y el progreso están en
[`PLAN_FRONTEND.md`](./PLAN_FRONTEND.md).

## Stack

- Angular 22 con componentes standalone, signals y control de flujo `@if` / `@for`.
- TypeScript estricto y `strictTemplates`.
- SCSS y Angular Material 22 con tokens propios de FIXTECH.
- Roboto y Material Symbols autoalojados en `public/fonts/`; sin peticiones a Google Fonts.
- Vitest para pruebas unitarias.
- Playwright y `@axe-core/playwright` para E2E, accesibilidad y regresión visual.
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
| `npm run e2e:seed`     | Crea o reutiliza las cuentas semilla de E2E    |

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
finalización y conformidad. La prueba de taller crea un técnico que solo atiende en taller y
verifica constancias de recepción y entrega, finalización, reseña del cliente, respuesta y reporte
del técnico, moderación administrativa, reclamo con foto, respuesta técnica y el seguimiento
`ABIERTO → EN_REVISION → RESUELTO → CERRADO`. La prueba de catálogos crea, edita, desactiva,
oculta, reactiva y crea un distrito real; el smoke administrativo recorre parámetros, reportes y
auditoría. La prueba de notificaciones y perfil consulta la bandeja real, aplica el filtro de no
leídas, revisa el badge y la cuenta de solo lectura, y verifica el aviso de sesión expirada; todo
con Axe en escritorio y 360 px. La prueba de seguridad verifica que un `returnUrl` externo no
redirija fuera de la SPA, que un rol sin permisos llegue a `/no-autorizado`, que los tokens vivan
solo en `sessionStorage` y que el aviso de conexión aparezca dentro de la aplicación. Las pruebas
responsive comprueban que no haya desbordamiento horizontal a 360, 768 y 1280 px y comparan
capturas del acceso contra las baselines de `e2e/visual-baselines/`. Requiere el backend y MySQL
locales. Sin `E2E_BACKEND=1` esas pruebas se omiten y solo corren las públicas. Para preparar las
cuentas base se usa `npm run e2e:seed`, que crea o reutiliza al administrador, un cliente y un
técnico aprobado; es idempotente y solo debe ejecutarse en desarrollo o en una base de pruebas. No
existe un endpoint para limpiar las cuentas, solicitudes y catálogos creados por las pruebas.

Para regenerar las capturas de referencia después de un cambio visual intencional:

```bash
npx playwright test e2e/responsive.spec.ts --update-snapshots
```

## Endurecimiento (Fase 11)

- **Rendimiento y fuentes:** Roboto y Material Symbols se sirven desde `public/fonts/`; el
  subconjunto de iconos contiene los 133 nombres usados por la SPA. El build de producción no hace
  peticiones a Google Fonts. Los presupuestos de `angular.json` quedaron en 650 kB de advertencia y
  750 kB de error para el bundle inicial, y 1.8 MB / 2 MB para el total de bundles. El build de
  cierre reporta 604.53 kB iniciales (146.40 kB de transferencia estimada). El lazy loading por
  ruta se mantiene y las imágenes autenticadas se descargan como blob.
- **Seguridad:** `returnUrl` solo acepta rutas internas bajo `/app`; se rechazan URLs absolutas,
  protocolo-relativas, segmentos `..` codificados y valores que escapan del prefijo. Las rutas de
  archivos entregadas por la API solo se aceptan si pertenecen al mismo origen y al prefijo
  `/api/`. No se usa `innerHTML`, `bypassSecurityTrust*`, `eval` ni `document.write`; Angular
  escapa los mensajes del backend. Los errores se normalizan y no exponen trazas. Se añadió
  `Referrer-Policy: strict-origin-when-cross-origin` a nivel de documento.
- **Conectividad:** `ConexionService` escucha `online`/`offline` y los layouts público y privado
  muestran un aviso `role="status"` cuando el navegador pierde la conexión. El aviso es informativo:
  `navigator.onLine` no garantiza que la API responda, por lo que cada petición conserva su manejo
  de error y reintento. No hay service worker ni modo offline-first.
- **Accesibilidad:** navegación con `aria-current="page"`, enlace “Saltar al contenido” en ambos
  layouts, foco al `<main>` tras cada navegación y estrellas de reseña con el eje `FILL` de
  Material Symbols. La suite E2E ejecuta Axe en escritorio y 360 px, incluidas las pantallas
  públicas y `/no-autorizado`.
- **Regresión visual:** capturas de `/login` a 360, 768 y 1280 px en
  `e2e/visual-baselines/responsive.spec.ts/`; las pruebas estructurales verifican además ausencia
  de desbordamiento horizontal.

### Limitación de `sessionStorage`

Los tokens de acceso y refresco se guardan en `sessionStorage` para el MVP. Esto evita compartirlos
entre pestañas y los borra al cerrar la pestaña, pero **no los protege de XSS**: cualquier script
que se ejecute en el origen puede leerlos. La mitigación actual es no introducir HTML dinámico ni
confiar en contenido del backend como markup. Para producción se recomienda migrar a cookies
`HttpOnly`, `Secure` y `SameSite` con protección CSRF, y mantener el access token en memoria. No se
usa `localStorage` para credenciales.

## Estructura

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/          # Sesión, AuthService, refresh, interceptores y guards
│   │   ├── catalogos/     # Catálogos públicos de especialidades y distritos
│   │   ├── conexion/      # Estado online/offline del navegador
│   │   ├── http/          # Normalización de errores y descarga autenticada de archivos
│   │   ├── layout/        # Layout público y layout privado con sidenav
│   │   ├── models/        # Etiquetas, fechas y tipos compartidos
│   │   └── notificaciones/ # Estado, carga, marcado y polling de notificaciones
│   ├── features/
│   │   ├── admin/         # Técnicos, usuarios, reseñas, reclamos, catálogos, parámetros,
│   │   │                  # reportes y auditoría
│   │   ├── auth/          # Login, registro de cliente, registro de técnico y recuperación de contraseña
│   │   ├── cliente/       # Solicitudes: creación, listado, detalle, edición y cancelación
│   │   ├── dashboard/     # Panel inicial por rol
│   │   ├── errors/        # Páginas 403 y 404
│   │   ├── notificaciones/ # Centro de notificaciones con filtro y “leer todas”
│   │   ├── ofertas/       # Ofertas, negociación, comparación y aceptación
│   │   ├── perfil/        # Perfil general de la cuenta, solo lectura
│   │   ├── servicios/     # Ejecución, constancias, reseñas, reclamos y conformidad
│   │   └── tecnico/       # Perfil editable del técnico, foto y estado de verificación
│   ├── shared/ui/         # Marca, badges, iconos, notificaciones e imágenes autenticadas
│   ├── app.config.ts      # Locale es-PE, router y HttpClient con interceptores
│   └── app.routes.ts      # Rutas públicas y privadas con lazy loading
├── environments/          # URLs de API por entorno
├── styles.scss            # Tema Material, tokens, fuentes y utilidades globales
└── index.html
public/fonts/              # Roboto y subconjunto de Material Symbols
e2e/                       # Pruebas Playwright, Axe y baselines visuales
```

## Roles y navegación

| Rol       | Acceso inicial | Navegación habilitada                                                                                                                                       |
| --------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLIENTE` | `/app/inicio`  | Inicio, notificaciones, mi cuenta, nueva solicitud, mis solicitudes y mis servicios; ofertas y negociación en el detalle                                    |
| `TECNICO` | `/app/inicio`  | Inicio, notificaciones, mi cuenta, mi perfil profesional, solicitudes disponibles, mis ofertas y mis servicios; bloqueado si no está aprobado o tiene deuda |
| `ADMIN`   | `/app/inicio`  | Inicio, notificaciones, mi cuenta, técnicos, usuarios, reseñas, reclamos, comisiones y pagos, reportes, catálogos, parámetros y auditoría                   |

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
- `/app/admin/resenas`: lista `GET /api/admin/resenas?estado=` con filtro por estado. Solo las
  reseñas `REPORTADA` muestran las acciones de moderación; `PATCH
/api/admin/resenas/{id}/moderacion` permite volver a `VISIBLE` u `OCULTA` con confirmación.
- `/app/admin/reclamos`: lista `GET /api/admin/reclamos?estado=` y consulta `GET
/api/admin/reclamos/{id}` al expandir el detalle. Muestra las fotos autenticadas, la respuesta
  del técnico y las transiciones `ABIERTO → EN_REVISION → RESUELTO|CERRADO` y `RESUELTO →
CERRADO` con `PATCH /api/admin/reclamos/{id}/estado`. Resolver o cerrar exige una resolución de
  hasta 1000 caracteres.
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
> `documento_tecnico` no tiene controlador expuesto. El perfil no inventa documentos. La
> recuperación de contraseña mediante OTP ya está disponible en `/recuperar-password`.

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
  datos de contacto, PIN de inicio en domicilio, historial de estados, constancias de taller,
  reseña y reclamos.
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
- En taller, la constancia de recepción se registra en `PROGRAMADO` o `EQUIPO_RECIBIDO` y provoca
  la transición automática a `EQUIPO_RECIBIDO`; la constancia de entrega se registra en
  `LISTO_PARA_RECOGER`. Sin constancia de entrega el botón de finalización no aparece. El detalle
  muestra avisos mientras falte cada constancia.

> Brecha: la mensajería no tiene actualización en tiempo real.

## Constancias, reseñas y reclamos

- Las constancias de taller usan `POST /api/servicios/{id}/constancias` (multipart: `tipo`,
  `observaciones`, `accesorios` y 1 a 5 fotos JPG/PNG de hasta 5 MB), `POST
/api/servicios/{id}/constancias/{constanciaId}/confirmar` y `GET
.../constancias/{constanciaId}/fotos/{fotoId}`. Solo el cliente confirma; las fotos se descargan
  como blob autenticado.
- La reseña se crea con `POST /api/servicios/{id}/resenas` cuando el servicio está `CONFIRMADO` y
  pasa al estado `CALIFICADO`. Admite 1 a 5 estrellas, criterios opcionales y un comentario de
  hasta 1000 caracteres; solo existe una reseña por servicio y el plazo lo define el backend.
- El técnico responde una sola vez con `PATCH /api/servicios/{id}/resenas/{resenaId}/respuesta` y
  puede reportar una reseña `VISIBLE` con `POST .../reporte`. Administración modera únicamente las
  reseñas `REPORTADA` desde `/app/admin/resenas`.
- Los reclamos se crean con `POST /api/servicios/{id}/reclamos` (multipart: `descripcion` y 1 a 5
  fotos) solo en `CONFIRMADO` o `CALIFICADO` y solo si no hay otro reclamo activo. El técnico
  responde una vez mientras el reclamo esté `ABIERTO` o `EN_REVISION`; el cliente y el técnico ven
  la resolución administrativa y el estado del seguimiento.
- Las constancias, reseñas y reclamos tienen estados de carga, error con reintento y vacío. Los
  conflictos `409` se muestran con el mensaje del backend sin ocultar el estado actual.

## Comisiones y pagos

- `/app/tecnico/comisiones` consulta `GET /api/comisiones/mi-saldo` y muestra saldo pendiente,
  total pagado, límite de deuda, comisiones vencidas, próximo vencimiento, comisiones pendientes e
  historial. El aviso de bloqueo enlaza a la regularización desde el panel y la navegación.
- El pago se registra con `POST /api/comisiones/pagos` multipart: una o más `comisionIds`, método
  `YAPE`, `PLIN` o `TRANSFERENCIA`, número de operación de hasta 40 caracteres y comprobante
  JPG/PNG de hasta 5 MB. El formulario valida tipo, tamaño y longitud antes de enviar.
- Las comisiones incluidas en un pago `PENDIENTE` o `VALIDADO` no se pueden volver a seleccionar.
  Un rechazo conserva las comisiones pendientes y muestra el motivo administrativo.
- El historial usa `GET /api/comisiones/pagos?estado=` y el comprobante se descarga como blob
  autenticado desde `GET /api/comisiones/pagos/{id}/comprobante`.
- `/app/admin/comisiones` lista `GET /api/admin/pagos?estado=` y valida o rechaza con `PATCH
/api/admin/pagos/{id}/validacion`. Validar marca las comisiones como pagadas y recalcula el
  bloqueo; rechazar exige una observación de hasta 300 caracteres. La confirmación es obligatoria
  en ambos casos.
- La pestaña de deudores consume `GET /api/admin/comisiones/deudores` y muestra saldo, límite,
  comisiones pendientes y vencidas, próximo vencimiento y bloqueo. Los comprobantes administrativos
  se descargan desde `GET /api/admin/pagos/{id}/comprobante`.

> Brecha: el backend no expone desbloqueo manual ni edición o anulación de pagos. El bloqueo se
> sincroniza al validar pagos y con la revisión programada; la interfaz explica ese comportamiento
> y no ofrece acciones que la API no admita.

## Catálogos, parámetros, reportes y auditoría

- `/app/admin/catalogos` administra tipos de equipo, tipos de servicio, especialidades y distritos
  con `GET/POST/PUT /api/admin/catalogos/{tipo}`. El listado usa `incluirInactivos=true` por
  defecto y permite ocultar los inactivos; la búsqueda se aplica en el cliente.
- El diálogo de alta y edición es único y adapta sus campos al catálogo: nombre, descripción
  opcional y, en distritos, provincia y tope de movilidad. Los límites replican el backend (60 u
  80 caracteres según el catálogo, descripción de hasta 200 y provincia de hasta 60, tope de
  movilidad de 0 a 1,000,000.00).
- La activación y desactivación usan `PATCH /api/admin/catalogos/{tipo}/{id}/estado` con
  `{ activo }`. Desactivar exige confirmación; activar no. No se ofrece borrado físico porque la
  API no lo expone.
- `/app/admin/parametros` edita los 13 parámetros del sistema con `GET/PUT /api/admin/parametros`.
  El formulario muestra descripción, valor vigente y última actualización, valida enteros,
  decimales y rangos igual que el backend, y envía solo los parámetros modificados.
- `/app/admin/reportes` muestra el dashboard de `GET /api/admin/dashboard` y el reporte de
  `GET /api/admin/reportes?desde=&hasta=`. El periodo es obligatorio, no puede superar los 366
  días de diferencia y la descarga usa `GET /api/admin/reportes/excel` como blob autenticado,
  respetando el nombre indicado en `Content-Disposition`.
- `/app/admin/auditoria` consulta `GET /api/admin/auditoria` con filtros por usuario, entidad,
  acción y rango de fechas opcional, y paginación de 20 elementos. Cada registro muestra la acción,
  entidad afectada, detalle, IP y fecha.
- Los cuatro módulos incluyen estados de carga, error con reintento y vacío, y son accesibles desde
  la navegación lateral y el panel inicial del administrador.

## Notificaciones y cuenta

- `/app/notificaciones` está disponible para todos los roles y consume
  `GET /api/notificaciones?soloNoLeidas=`. La respuesta incluye `notificaciones` y `noLeidas`; no
  hay paginación, por lo que la bandeja se muestra completa con estados de carga, error con
  reintento y vacío.
- Cada notificación muestra título, mensaje, fecha, tipo y referencia. “Marcar como leída” usa
  `PATCH /api/notificaciones/{id}/leer` y “Marcar todas como leídas” usa
  `PATCH /api/notificaciones/leer-todas`.
- El layout muestra el contador de no leídas en la barra superior, la navegación lateral y el menú
  de usuario. El contador se refresca cada 60 segundos; los fallos del polling se silencian con
  `SILENCIAR_ERROR` para no repetir avisos globales.
- `/app/perfil` muestra la cuenta de solo lectura desde `GET /api/auth/me`: identidad, correo, rol,
  estado e identificador. Los técnicos ven además su resumen profesional y un enlace al perfil
  editable de `/app/tecnico/perfil`.
- Si el refresh de tokens falla, se limpia la sesión y se redirige a `/login?sesion=expirada` con
  un aviso accesible. El login consume el aviso una sola vez, tanto por el query param como por
  `SesionExpiradaService`.

> Brecha: no existen endpoints para editar el perfil general. La recuperación de contraseña
> mediante OTP ya está disponible en `/recuperar-password` (ver sección de autenticación).

## Autenticación

1. `POST /api/auth/login` devuelve `accessToken`, `refreshToken` y `expiraEnSegundos`.
2. Los tokens se guardan en `sessionStorage` mediante `SessionStore`.
3. `GET /api/auth/me` carga el perfil y, para técnicos, el estado de verificación, el motivo,
   el bloqueo por deuda, el saldo pendiente y las modalidades.
4. `authInterceptor` agrega `Authorization: Bearer <token>` a las llamadas a la API, excepto
   las rutas públicas: login, refresh, registro y `/auth/recuperacion/*`.
5. Ante un `401`, se renueva el token una sola vez con `POST /api/auth/refresh` y se reintenta
   la solicitud. Si el refresh falla, se limpia la sesión, se marca la expiración y se redirige al
   login con un aviso accesible.
6. `errorInterceptor` normaliza los errores del backend en `ApiError` y muestra notificaciones
   para fallos de red o de servidor.

### Recuperación de contraseña

La ruta `/recuperar-password` permite restablecer la contraseña sin sesión mediante un código
OTP de seis dígitos:

1. El usuario ingresa su correo y recibe un código de seis dígitos (o un mensaje genérico si no
   está registrado, sin revelar la existencia de la cuenta).
2. Verifica el código y el backend devuelve un ticket temporal de un solo uso.
3. Con el ticket puede crear una nueva contraseña o acceder directamente sin cambiarla.

El enlace "¿Olvidaste tu contraseña?" aparece en el login. Tras restablecer, la aplicación
redirige al login con el aviso `recuperado=1`. Si el usuario elige acceder sin cambiar la
contraseña, ingresa directamente al panel. El ticket expira y no puede reutilizarse.

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

No existen todavía endpoints para carga de documentos de verificación ni búsqueda pública de
técnicos. La recuperación de contraseña mediante OTP ya está implementada (ver sección de
autenticación). La edición de perfil y la foto del técnico ya están cubiertas por
`PUT /api/perfil/tecnico`, `POST /api/perfil/foto` y `GET /api/tecnicos/{id}/foto`.
Para clientes no existe un endpoint de limpieza de solicitudes creadas por pruebas. El contrato de
ofertas tampoco incluye el resumen de la solicitud en `OfertaResponse` ni una consulta directa de
la oferta propia por solicitud, y el detalle disponible deja de responder cuando la solicitud deja
de ser compatible.

Tampoco existen endpoints para desbloquear manualmente a un técnico ni para editar o anular un
pago de comisión; el bloqueo se sincroniza automáticamente al validar pagos y con la revisión
programada del backend. Los catálogos administrativos no tienen borrado físico: se crean, editan y
activan o desactivan.

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
de error anunciados. Las pantallas y diálogos de las fases 2 a 9 también se auditan; los iconos
de los botones con `aria-label` se renderizan como SVG decorativos para no mezclar ligaduras de
fuentes con el nombre accesible.

## Despliegue

El build de producción genera una SPA en `dist/fixtech-frontend/browser`. La carpeta `deploy/`
contiene los artefactos de despliegue:

| Archivo                                     | Uso                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `deploy/nginx/fixtech.conf`                 | Nginx para VPS: fallback SPA, proxy `/api`, caché, gzip y cabeceras |
| `deploy/nginx/fixtech.docker.conf.template` | Configuración del contenedor con `envsubst`                         |
| `deploy/Dockerfile`                         | Imagen multietapa Node 22 + Nginx                                   |
| `deploy/docker-compose.yml`                 | Pila frontend, backend y MySQL                                      |
| `deploy/.env.example`                       | Plantilla de variables de entorno                                   |
| `deploy/smoke-test.sh`                      | Prueba de humo con 14 comprobaciones                                |
| `deploy/calcular-csp-hash.py`               | Cálculo del hash SHA-256 del script inline de Angular               |

Pasos para Nginx:

1. Ejecutar `npm run build`.
2. Copiar `dist/fixtech-frontend/browser` a `/var/www/fixtech`.
3. Ajustar `server_name` y `proxy_pass` en `deploy/nginx/fixtech.conf`.
4. Copiar la configuración a `/etc/nginx/sites-available/fixtech`, enlazarla y validar con
   `nginx -t`.
5. Incluir el origen público en `FIXTECH_CORS_ORIGINS` del backend.
6. Recalcular el hash CSP con `deploy/calcular-csp-hash.py` y actualizarlo en la configuración
   si cambió.
7. Ejecutar `./deploy/smoke-test.sh https://dominio`.

```bash
python3 deploy/calcular-csp-hash.py dist/fixtech-frontend/browser/index.html
```

La SPA usa `apiUrl: '/api'` en producción: Nginx publica la SPA y la API bajo el mismo origen y
redirige `/api` al backend. El backend debe incluir el origen público en `FIXTECH_CORS_ORIGINS`
porque el navegador envía `Origin` en las peticiones que modifican datos. El hash CSP vigente es
`sha256-LMY6wYoFV9I4wWzxaq1N/dTpl4iurQktw706UCHK3vM=`; debe recalcularse cuando cambie el build.

La prueba de humo se ejecutó contra Nginx en `http://127.0.0.1:8083` con el backend en
`http://127.0.0.1:8082`: 14 comprobaciones correctas, incluido el login administrativo y las
cabeceras de seguridad. La configuración de Docker Compose se validó con `docker-compose config`;
la imagen no se construyó en el entorno de desarrollo porque el daemon no era accesible sin
permisos. El procedimiento completo está en `docs/word/02_Manual_Despliegue_FIXTECH.md` y en el
documento final de `/home/juan/Documentos/calidadd/`.

## Cierre de calidad (Fase 12)

- 501 pruebas unitarias en 77 archivos, sin fallos.
- 54 ejecuciones E2E: 51 aprobadas y 3 comparaciones visuales omitidas en el proyecto móvil.
- Axe sin violaciones en las pantallas evaluadas; ESLint y Prettier sin errores.
- Build de producción: 604.53 kB iniciales y 146.40 kB de transferencia estimada.
- Backend: 337 pruebas y 0 fallos; cobertura de 94.00 % en servicios y 87.08 % global; JMeter con
  p95 de 103 ms y 0 errores; OWASP ZAP sin alertas altas, medias ni bajas.
- Documentos Word: informe de QA, manual de despliegue, documentación técnica, manual de usuario,
  checklist de aceptación y acta de conformidad.
