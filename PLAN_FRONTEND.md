# Plan de trabajo — Frontend FIXTECH

Documento de seguimiento del frontend Angular de FIXTECH. Cada fase se cierra solo cuando
compila, pasa pruebas, pasa lint y mantiene accesibilidad básica en escritorio y en 360 px.

## 1. Contexto y decisiones

- **Producto:** plataforma que conecta clientes con técnicos verificados en Piura.
- **Roles:** `CLIENTE`, `TECNICO` y `ADMIN`, con navegación y permisos diferenciados.
- **Arquitectura:** SPA Angular 22, sin SSR ni hidratación.
- **Backend:** API REST en `http://localhost:8082/api` (Swagger/OpenAPI como fuente de verdad).
- **Sesión:** JWT en `sessionStorage` para el MVP. Limitación conocida: la sesión no se comparte
  entre pestañas y se pierde al cerrar la pestaña. Se documentará una alternativa con cookies
  `HttpOnly` para producción.
- **Estilos:** SCSS, Angular Material 22, enfoque mobile-first desde 360 px.
- **Calidad:** TypeScript estricto, Vitest, ESLint, Prettier, Playwright y `@axe-core/playwright`.
- **Regla de API:** no se inventan endpoints ni campos. Si falta un contrato, se registra como
  brecha y se implementa solo con autorización expresa.

## 2. Comandos

```bash
# Requiere Node 22
source ~/.nvm/nvm.sh && nvm use

npm install
npm start                 # desarrollo en http://localhost:4200
npm run build             # build de producción
npm test                  # pruebas unitarias (una ejecución)
npm run lint              # ESLint
npm run format:check      # verificación de formato
npm run e2e               # Playwright (escritorio + móvil 360 px)

# Login real contra backend local
E2E_BACKEND=1 npm run e2e -- --project=chromium
```

Backend local:

```bash
cd /home/juan/IdeaProjects/CalidadSoftware
./mvnw spring-boot:run
```

Credenciales de desarrollo: `admin@fixtech.pe` / `Admin123!`.

## 3. Estado general

| Fase | Alcance                                                | Estado        |
| ---- | ------------------------------------------------------ | ------------- |
| 0    | Base técnica, SSR, tooling y sistema de diseño         | ✅ Completada |
| 1    | Autenticación, sesión, guards, interceptores y layouts | ✅ Completada |
| 2    | Panel admin: técnicos y usuarios                       | ✅ Completada |
| 3    | Registro y perfil de técnico                           | ✅ Completada |
| 4    | Cliente: solicitudes y adjuntos                        | ✅ Completada |
| 5    | Técnico: solicitudes disponibles y ofertas             | ✅ Completada |
| 6    | Servicios: aceptación y ejecución del servicio         | ✅ Completada |
| 7    | Cierre, constancias, reseñas y reclamos                | ✅ Completada |
| 8    | Comisiones y pagos del técnico                         | ⏳ Pendiente  |
| 9    | Administración de catálogos, parámetros y reportes     | ⏳ Pendiente  |
| 10   | Notificaciones y perfil de usuario                     | ⏳ Pendiente  |
| 11   | Endurecimiento UX, rendimiento y seguridad             | ⏳ Pendiente  |
| 12   | QA final, documentación y despliegue                   | ⏳ Pendiente  |

## 4. Fase 0 — Base técnica ✅

- [x] Desactivar SSR: quitar `@angular/ssr`, `@angular/platform-server`, `express` y archivos
      `server.ts`, `main.server.ts`, `app.config.server.ts`, `app.routes.server.ts`.
- [x] Eliminar `provideClientHydration` y el script `serve:ssr`.
- [x] Activar TypeScript estricto y `strictTemplates`.
- [x] Configurar `LOCALE_ID` `es-PE` y formateo local de moneda/fechas.
- [x] Configurar `provideHttpClient(withFetch())` y `withComponentInputBinding()`.
- [x] Configurar entornos `environment.ts` (desarrollo) y `environment.prod.ts` (`/api`).
- [x] Configurar Angular Material 22 con tema y tokens visuales de FIXTECH.
- [x] Estilos globales mobile-first, foco visible, movimiento reducido y utilidades compartidas.
- [x] Configurar ESLint con `angular-eslint`, Prettier y scripts de calidad.
- [x] Configurar Playwright con proyectos de escritorio y móvil de 360 px.
- [x] Estructura `core/`, `features/`, `shared/` y componentes standalone.
- [x] Manejo centralizado de errores de API (`ApiError`, interceptor y notificaciones).
- [x] Documentar comandos, decisiones y limitaciones en `PLAN_FRONTEND.md`.

## 5. Fase 1 — Autenticación y shell ✅

### Backend habilitado en esta fase

- [x] `GET /api/auth/me`: perfil del usuario autenticado; para técnicos incluye verificación,
      motivo, bloqueo por deuda, saldo y modalidades.
- [x] `GET /api/admin/tecnicos`: listado para administración con filtros
      `estadoVerificacion` y `busqueda`. Devuelve `id` (técnico) y `usuarioId` para resolver el
      desajuste con `PATCH /api/admin/tecnicos/{id}/verificacion`.
- [x] Restringir `/api/auth/**`: solo login, refresh y registros son públicos; `/me` exige JWT.
- [x] Pruebas de servicio para el perfil y el listado administrativo.

### Frontend

- [x] `SessionStore` con `accessToken`, `refreshToken`, expiración y limpieza en `sessionStorage`.
- [x] `AuthService` con login, registro de cliente, perfil, restauración de sesión y cierre.
- [x] `authInterceptor` con renovación de token y reintento único ante 401.
- [x] `errorInterceptor` que normaliza errores del backend y evita duplicar mensajes en auth.
- [x] `authGuard`, `guestGuard`, `roleGuard` y `tecnicoAprobadoGuard`.
- [x] Layout público con marca, navegación y pie.
- [x] Layout privado con sidenav responsive, barra superior, menú de usuario y navegación por rol.
- [x] Login con validación, mostrar/ocultar contraseña, estado de carga y error en línea.
- [x] Registro de cliente alineado a `RegistroClienteRequest`.
- [x] Panel inicial por rol con estado de verificación, deuda, modalidades y próximos módulos.
- [x] Gating de ofertas: un técnico no aprobado o bloqueado por deuda no ve habilitadas las
      rutas de solicitudes/ofertas.
- [x] Páginas 403 y 404.
- [x] Pruebas unitarias de sesión, autenticación, guards y login.
- [x] E2E de login/registro/404 con Axe en escritorio y 360 px.
- [x] Build de producción, lint y formato sin errores.

### Criterios de cierre

- [x] El build de producción genera la SPA en `dist/fixtech-frontend`.
- [x] Las pruebas unitarias pasan en una ejecución limpia.
- [x] ESLint y Prettier pasan sin errores.
- [x] Login, registro, guards, layouts y logout funcionan con el backend local.
- [x] La vista principal se adapta desde 360 px sin desbordamiento horizontal.
- [x] Axe no reporta violaciones en la pantalla de login.

## 6. Fase 2 — Panel admin: técnicos y usuarios ✅

### Endpoints usados

- `GET /api/admin/tecnicos` con `estadoVerificacion` y `busqueda`.
- `PATCH /api/admin/tecnicos/{id}/verificacion` con `{ estado, motivo }`; usa el `id` del
  técnico y no el `usuarioId`.
- `GET /api/admin/usuarios` con `rol`, `estado` y `busqueda`.
- `PATCH /api/admin/usuarios/{id}/estado` con `{ estado, motivo }`.

### Frontend

- [x] Listado de técnicos con filtros por estado de verificación y búsqueda por nombre, correo,
      DNI o celular.
- [x] Detalle expandible con contacto, modalidades, calificación, reseñas, servicios, saldo,
      bloqueo por deuda y fechas de registro/verificación.
- [x] Aprobar, observar o rechazar usando `PATCH /api/admin/tecnicos/{id}/verificacion`.
- [x] Motivo obligatorio para observar/rechazar (máximo 300 caracteres) y confirmación accesible
      mediante diálogo con foco gestionado.
- [x] Listado de usuarios con filtros por rol, estado y búsqueda.
- [x] Cambio de estado con `PATCH /api/admin/usuarios/{id}/estado`; suspender exige motivo y
      confirmación, reactivar no.
- [x] Protección en interfaz de cuentas `ADMIN` y de la propia cuenta; el backend también
      responde `403` si se intenta.
- [x] Manejo inline de `409`/`403` sin cerrar el diálogo y refresco del listado tras cada cambio.
- [x] Estados de carga, error con reintento y vacío en ambas pantallas.
- [x] Rutas `/app/admin/tecnicos` y `/app/admin/usuarios` protegidas con `roleGuard` y acceso
      habilitado desde el menú y el panel inicial.
- [x] Componente compartido de badge de estado e iconos SVG accesibles para botones con
      `aria-label`, evitando que Axe interprete las ligaduras de la fuente como texto visible.
- [x] Pruebas unitarias de servicios, filtros, diálogos, validaciones, errores y protección de
      cuentas.
- [x] E2E real de aprobación: crea un técnico único por API, lo busca, aprueba y verifica el
      estado con `GET /api/admin/tecnicos`.

> Brecha: `TecnicoAdminResponse` no incluye documentos de verificación. El detalle muestra una
> nota explícita y no inventa documentos ni campos. La tabla `documento_tecnico` sigue sin
> controlador expuesto.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 53 pruebas unitarias en verde.
- [x] 10 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en login, registro, listados, detalle de técnico y ambos diálogos.
- [x] Aprobación real de un técnico verificada contra la API.

## 7. Fase 3 — Registro y perfil de técnico ✅

### Endpoints usados

- `POST /api/auth/register/tecnico` con datos personales, modalidades, taller, especialidades y
  distritos. Responde `201` con `{ id, correo, rol }`; no devuelve tokens.
- `GET /api/catalogos/especialidades`: catálogo público de especialidades activas.
- `GET /api/catalogos/distritos`: catálogo público de distritos con `topeMovilidad`.
- `GET /api/auth/me`: perfil del técnico con estado de verificación, motivo, modalidades,
  descripción, experiencia, calificación, reseñas, servicios y bloqueo por deuda.

### Frontend

- [x] Formulario `/registro-tecnico` con datos personales, perfil profesional, modalidades,
      especialidades y distritos.
- [x] Catálogos públicos cargados con estados de carga, error con reintento y vacío.
- [x] Validaciones espejo del backend: correo, celular, DNI, contraseña, años de experiencia
      entero entre 0 y 60, descripción y límites de taller.
- [x] Al menos una modalidad obligatoria y dirección de taller obligatoria cuando se ofrece
      atención en taller.
- [x] Al menos una especialidad y un distrito; los campos de taller se ocultan y limpian cuando
      no aplican.
- [x] Enlaces al registro de técnico desde el login y el registro de cliente.
- [x] Tras el registro se redirige al login con un aviso; el técnico inicia sesión por separado.
- [x] Pantalla `/app/tecnico/perfil` protegida con `roleGuard` para `TECNICO`, con identidad,
      estado de verificación, motivo, modalidades, descripción, experiencia, estadísticas, DNI,
      celular, especialidades, distritos y datos de la cuenta.
- [x] Mensajes específicos para `PENDIENTE`, `APROBADO`, `OBSERVADO` y `RECHAZADO`, además del
      bloqueo por deuda.
- [x] Perfil editable con `PUT /api/perfil/tecnico` y foto con `POST /api/perfil/foto`, completado
      junto con la Fase 4. Editar reinicia la verificación a `PENDIENTE`; cambiar la foto no.
- [x] Acceso a “Mi perfil” desde la navegación del técnico.
- [x] Pruebas unitarias de servicio de catálogos, registro de técnico, validaciones, estados del
      formulario y mensajes del perfil.
- [x] E2E real: registra un técnico único desde la interfaz, inicia sesión, abre su perfil,
      comprueba el estado “En revisión”, la edición y la foto; audita ambas pantallas con Axe en
      escritorio y 360 px.

> Brechas: los documentos de verificación siguen sin flujo administrativo porque
> `documento_tecnico` no tiene controlador expuesto. No hay endpoints de cambio o recuperación de
> contraseña. El E2E crea cuentas reales y no hay endpoint de limpieza.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 73 pruebas unitarias en verde.
- [x] E2E de registro y perfil en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en el formulario de registro y en el perfil del técnico.
- [x] El registro real responde `201` y el perfil muestra el estado `PENDIENTE`.

## 8. Fase 4 — Cliente: solicitudes, perfil editable y adjuntos ✅

### Endpoints usados

- `POST /api/solicitudes` multipart con `datos` JSON y `fotos` (1 a 5 imágenes JPG/PNG de hasta
  5 MB).
- `GET /api/solicitudes/mias?estado=` para el listado del cliente autenticado.
- `GET /api/solicitudes/{id}` para el detalle con ids de catálogo, dirección e imágenes.
- `PUT /api/solicitudes/{id}` para actualizar solo los datos; exige estado `PUBLICADA`.
- `DELETE /api/solicitudes/{id}?motivo=` para cancelar; aplica a `PUBLICADA` y `CON_OFERTAS`.
- `GET /api/solicitudes/{id}/imagenes/{imagenId}` para descargar imágenes con JWT.
- `GET /api/catalogos/tipos-equipo`, `/tipos-servicio` y `/distritos` para el formulario.
- `PUT /api/perfil/tecnico`, `POST /api/perfil/foto` y `GET /api/tecnicos/{id}/foto` para cerrar
  la brecha de edición y foto del perfil técnico.

### Frontend

- [x] Formulario de creación y edición con tipo de equipo, tipo de servicio, marca, modelo,
      descripción, urgencia, modalidad, distrito, dirección, fecha, horario y presupuesto.
- [x] Creación multipart con 1 a 5 fotos JPG/PNG de hasta 5 MB y vista previa local.
- [x] Validación de archivos por tipo, tamaño y cantidad antes de enviar.
- [x] Listado “Mis solicitudes” con filtro de estado contra el backend, paginación visual de seis
      elementos y estados de carga, error con reintento y vacío.
- [x] Detalle con datos, imágenes autorizadas, motivo de cancelación y acciones según el estado.
- [x] Edición solo para `PUBLICADA`; actualiza datos y conserva las fotos existentes.
- [x] Cancelación para `PUBLICADA` y `CON_OFERTAS` mediante diálogo accesible con motivo opcional
      de hasta 300 caracteres.
- [x] Imágenes descargadas como blob autenticado con `ImagenAutenticada`; nunca se usan URLs
      públicas.
- [x] Rutas `/app/cliente/solicitudes`, `/nueva`, `/{id}` y `/{id}/editar` con lazy loading y
      `roleGuard` de cliente.
- [x] Panel del cliente con CTA “Nueva solicitud” y accesos a “Mis solicitudes”; navegación del
      cliente habilitada.
- [x] Perfil del técnico editable con DNI, celular, especialidades, distritos, modalidades, taller
      y garantía; la foto se muestra mediante endpoint autorizado.
- [x] Editar el perfil reinicia la verificación a `PENDIENTE` y limpia motivo, verificador y
      fecha; cambiar la foto no reinicia la verificación.
- [x] Pruebas unitarias de `SolicitudesService`, formulario, listado, detalle, diálogo de
      cancelación, `PerfilTecnicoService` e `ImagenAutenticada`.
- [x] E2E de Axe en escritorio y 360 px para formulario, detalle, listado y diálogo.
- [x] E2E real: crea un cliente por API, publica una solicitud con foto, la edita, la cancela y la
      encuentra con el filtro “Cancelada”.

> Brechas: `PUT /api/solicitudes/{id}` no permite reemplazar ni agregar fotos; solo se adjuntan al
> crear. No existe un endpoint de limpieza de cuentas ni de solicitudes creadas por las pruebas.
> Los documentos de verificación del técnico siguen sin controlador expuesto.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 128 pruebas unitarias en 21 archivos, todas en verde.
- [x] 14 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en formulario, detalle, listado y diálogo de cancelación.
- [x] Creación, edición y cancelación reales verificadas contra la API.

## 9. Fase 5 — Técnico: solicitudes y ofertas ✅

### Endpoints usados

- `GET /api/solicitudes/disponibles` y `GET /api/solicitudes/disponibles/{id}` para el listado y
  el detalle de solicitudes compatibles.
- `POST /api/solicitudes/{id}/ofertas`, `PUT /api/ofertas/{id}` y `DELETE /api/ofertas/{id}` para
  crear, editar y retirar ofertas.
- `GET /api/ofertas/mias` para “Mis ofertas” y para detectar la oferta propia de una solicitud.
- `GET /api/solicitudes/{id}/ofertas?orden=` y `GET /api/solicitudes/{id}/ofertas/comparar?ids=`
  para las ofertas recibidas y la comparación del cliente.
- `POST /api/ofertas/{id}/contraoferta` con `accion` `CONTRAOFERTA`, `ACEPTAR` o `RECHAZAR` para
  la negociación en ambos sentidos.

### Frontend

- [x] Listado “Solicitudes disponibles” con búsqueda local por equipo, servicio o distrito,
      paginación visual y marca de las solicitudes que ya tienen oferta propia.
- [x] Detalle de solicitud compatible con fotos autorizadas, datos de contacto, oferta propia,
      historial de negociación y acciones según el estado.
- [x] Formulario de oferta con modalidad, precio del servicio, movilidad, diagnóstico, tiempo,
      garantía y mensaje; valida el tope de movilidad del distrito y la modalidad en taller.
- [x] Edición solo para ofertas `ENVIADA` o `CONTRAOFERTADA`; retiro con diálogo de confirmación.
- [x] “Mis ofertas” con filtros por estado, métricas, paginación y respuesta a contraofertas.
- [x] Ofertas recibidas en el detalle del cliente, orden por precio, calificación o tiempo,
      selección de hasta tres y diálogo comparativo.
- [x] Negociación cliente/técnico con contraofertas, aceptación y rechazo; aceptar la contraoferta
      del técnico desde el cliente crea el servicio y cierra el resto de ofertas.
- [x] Gating con `tecnicoAprobadoGuard` sobre `auth.puedeOfertar()`: aprobación y ausencia de deuda.
- [x] Rutas `/app/tecnico/solicitudes`, `/{solicitudId}`, `/{solicitudId}/ofertar`,
      `/app/tecnico/ofertas` y `/{ofertaId}/editar` con lazy loading y `roleGuard` de técnico.
- [x] Navegación del técnico y panel con accesos a solicitudes disponibles y mis ofertas.
- [x] Pruebas unitarias de servicios, etiquetas, listados, detalle, formulario, diálogos de
      comparación/retiro/contraoferta, ofertas recibidas y guards.
- [x] E2E real: registra y aprueba un técnico por API, publica una solicitud con foto, envía una
      oferta, negocia en dos rondas y el cliente acepta la contraoferta hasta crear el servicio.

> Importante: `OfertaResponse.precioTotal` y `Servicio.montoTotal` ya excluyen
> `costoDiagnostico`. El frontend no debe volver a sumarlo.

> Brechas: `OfertaResponse` solo incluye `solicitudId`; el detalle disponible responde `403` cuando
> la solicitud deja de ser compatible; no hay consulta directa de la oferta propia por solicitud y
> el listado de disponibles no valida aprobación ni deuda (lo hace el guard del frontend). La
> aceptación directa de una oferta normal se completó en la Fase 6.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 192 pruebas unitarias en 31 archivos, todas en verde.
- [x] 16 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en listado, detalle, formulario y diálogos de la fase.
- [x] Flujo real de oferta, contraoferta y creación del servicio verificado contra la API.

## 10. Fase 6 — Servicios: aceptación y ejecución ✅

### Endpoints usados

- `POST /api/ofertas/{id}/aceptar` para la aceptación directa de una oferta desde el cliente.
- `GET /api/servicios/mios?estado=`, `GET /api/servicios/{id}` y
  `PATCH /api/servicios/{id}/estado` para el listado, el detalle y los cambios de estado.
- `POST /api/servicios/{id}/finalizar` y `POST /api/servicios/{id}/conformidad` para el cierre.
- `GET/POST /api/servicios/{id}/avances` y `GET /api/servicios/{id}/avances/{avanceId}/foto` para
  los avances con foto.
- `GET/POST /api/servicios/{id}/mensajes` para la conversación del servicio.
- `POST /api/servicios/{id}/ajuste-precio` (multipart), `PATCH /api/ajustes/{id}/respuesta` y
  `GET /api/ajustes/{id}/evidencia` para los ajustes de precio.

### Frontend

- [x] Aceptación directa de una oferta con confirmación accesible; crea el servicio y navega a su
      detalle. La aceptación de contraofertas desde el cliente conserva el comportamiento de Fase 5.
- [x] “Mis servicios” para cliente y técnico, con filtros por estado y contadores.
- [x] Detalle del servicio con estado, fechas, modalidad, montos, contacto, PIN de inicio, historial
      y constancias.
- [x] Flujo de domicilio: iniciar traslado, validar PIN de 4 dígitos, registrar diagnóstico,
      reanudar el trabajo y finalizar con método de pago.
- [x] Avances con descripción y foto opcional (JPG/PNG de hasta 5 MB).
- [x] Mensajería con carga inicial, envío y botón “Actualizar”; sin tiempo real ni polling.
- [x] Ajustes de precio: propuesta del técnico con justificación y evidencia, aprobación o rechazo
      del cliente con confirmación y actualización del monto.
- [x] Confirmación de conformidad del cliente y visualización del monto final.
- [x] Rutas `/app/cliente/servicios`, `/app/cliente/servicios/:id`,
      `/app/tecnico/servicios` y `/app/tecnico/servicios/:id` con lazy loading y `roleGuard`.
- [x] Navegación y paneles de ambos roles con acceso a “Mis servicios”.
- [x] Pruebas unitarias de servicios HTTP, etiquetas y transiciones, listado, detalle, diálogos,
      avances, mensajes y ajustes.
- [x] E2E real: aceptación directa, PIN, diagnóstico con foto, mensajería, ajuste aprobado,
      finalización y conformidad, con auditoría Axe.

> Importante: `montoTotal`, `montoFinal` y `precioTotal` excluyen `costoDiagnostico`. El frontend
> muestra el diagnóstico por separado y nunca lo suma al total. Al finalizar se envía exactamente
> `montoTotal` como `montoFinal`; el diálogo solo permite elegir el método de pago.

> Continuación en Fase 7: el flujo de taller se completó con las constancias de recepción y
> entrega, la finalización condicionada y la confirmación del cliente. La Fase 6 dejó los avisos y
> las reglas de transición preparadas para esa integración.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 270 pruebas unitarias en 42 archivos, todas en verde.
- [x] 18 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en listado, detalle, diálogos, avances y mensajería.
- [x] Flujo real de aceptación, ejecución, ajuste, finalización y conformidad verificado contra la
      API.

## 11. Fase 7 — Cierre, constancias, reseñas y reclamos ✅

### Contratos usados

- `POST /api/servicios/{id}/constancias` (multipart: `tipo`, `observaciones`, `accesorios` y
  `fotos`), `POST /api/servicios/{id}/constancias/{constanciaId}/confirmar` y
  `GET /api/servicios/{id}/constancias/{constanciaId}/fotos/{fotoId}`.
- `POST/GET /api/servicios/{id}/resenas`, `PATCH /api/servicios/{id}/resenas/{resenaId}/respuesta`
  y `POST /api/servicios/{id}/resenas/{resenaId}/reporte`.
- `GET /api/admin/resenas?estado=` y `PATCH /api/admin/resenas/{id}/moderacion`.
- `POST/GET /api/servicios/{id}/reclamos` (multipart: `descripcion` y `fotos`), `GET
/api/servicios/{id}/reclamos/{reclamoId}`, `GET .../fotos/{fotoId}` y `PATCH
/api/servicios/{id}/reclamos/{reclamoId}/respuesta`.
- `GET /api/admin/reclamos?estado=`, `GET /api/admin/reclamos/{id}`, `GET
/api/admin/reclamos/{id}/fotos/{fotoId}` y `PATCH /api/admin/reclamos/{id}/estado`.

### Frontend

- [x] Constancias de taller con 1 a 5 fotos JPG/PNG de hasta 5 MB, accesorios, observaciones,
      fotos autenticadas y confirmación exclusiva del cliente.
- [x] La constancia de recepción en `PROGRAMADO` o `EQUIPO_RECIBIDO` transiciona el servicio a
      `EQUIPO_RECIBIDO`; la constancia de entrega se registra en `LISTO_PARA_RECOGER` y habilita la
      finalización. El detalle muestra avisos mientras falte cada constancia.
- [x] Reseña del cliente en `CONFIRMADO` con estrellas obligatorias, criterios opcionales y
      comentario de hasta 1000 caracteres; al crearla el servicio pasa a `CALIFICADO`.
- [x] Respuesta única del técnico y reporte de reseñas `VISIBLE`; pantalla administrativa
      `/app/admin/resenas` para moderar únicamente reseñas `REPORTADA` hacia `VISIBLE` u `OCULTA`.
- [x] Reclamo del cliente en `CONFIRMADO` o `CALIFICADO` con 1 a 5 fotos, un solo reclamo activo,
      respuesta única del técnico, resolución administrativa y seguimiento
      `ABIERTO → EN_REVISION → RESUELTO|CERRADO` (`RESUELTO → CERRADO`).
- [x] Pantalla `/app/admin/reclamos` con lista filtrable, detalle expandible consultado con
      `GET /api/admin/reclamos/{id}`, fotos autenticadas, respuesta del técnico y diálogos de
      resolución con texto obligatorio de hasta 1000 caracteres.
- [x] Estados de carga, error con reintento y vacío en constancias, reseña, reclamos y pantallas
      administrativas; errores `404` y `409` tratados sin romper el flujo.
- [x] Navegación y accesos del panel administrativo a reseñas y reclamos.
- [x] Pruebas unitarias de servicios HTTP, reglas de permisos y transiciones, diálogos, secciones,
      páginas administrativas y fixtures de constancias, reseñas y reclamos.
- [x] E2E real de taller: constancias de recepción y entrega con confirmación, finalización,
      conformidad, reseña, respuesta y reporte del técnico, moderación administrativa, reclamo con
      foto, respuesta técnica y revisión, resolución y cierre administrativos.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 358 pruebas unitarias en 52 archivos, todas en verde.
- [x] 20 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en constancias, reseñas, reclamos y sus diálogos.
- [x] Flujo real de taller, reseña y reclamo verificado contra la API.

## 12. Fase 8 — Comisiones y pagos ✅

### Contratos usados

- `GET /api/comisiones/mi-saldo`, con saldo pendiente, total pagado, límite, bloqueo,
  comisiones vencidas, próximo vencimiento, comisiones pendientes y pagos.
- `GET /api/comisiones/pagos?estado=` y `POST /api/comisiones/pagos` (multipart:
  `comisionIds`, `metodo`, `numeroOperacion` y `comprobante`).
- `GET /api/comisiones/pagos/{id}/comprobante` como blob autenticado.
- `GET /api/admin/pagos?estado=`, `GET /api/admin/pagos/{id}/comprobante` y `PATCH
/api/admin/pagos/{id}/validacion`.
- `GET /api/admin/comisiones/deudores`.

### Frontend

- [x] `/app/tecnico/comisiones` muestra el saldo, total pagado, límite de deuda, próximo
      vencimiento, comisiones pendientes e historial filtrable de pagos.
- [x] Aviso de bloqueo por deuda con acceso directo a la regularización desde la propia pantalla,
      el panel del técnico y la navegación lateral.
- [x] Selección múltiple de comisiones disponibles; las comisiones incluidas en un pago
      `PENDIENTE` o `VALIDADO` quedan deshabilitadas y se explican en la interfaz.
- [x] Registro de pago multipart con métodos `YAPE`, `PLIN` y `TRANSFERENCIA`, número de
      operación de hasta 40 caracteres y comprobante JPG/PNG obligatorio de hasta 5 MB, validado
      antes de enviar.
- [x] Historial con estado, monto, método, operación, comisiones incluidas, observación
      administrativa y comprobante autenticado en un diálogo.
- [x] `/app/admin/comisiones` con pestañas de pagos y deudores, filtro por estado, validación o
      rechazo con confirmación obligatoria y motivo obligatorio al rechazar (máximo 300
      caracteres).
- [x] Los pagos validados marcan sus comisiones como pagadas y recargan pagos y deudores; los
      rechazados conservan las comisiones pendientes y muestran el motivo al técnico.
- [x] Listado de deudores con saldo, límite, comisiones pendientes y vencidas, próximo vencimiento
      y estado de bloqueo. No se ofrecen acciones de desbloqueo manual ni anulación de pagos
      porque el backend no las expone.
- [x] Estados de carga, error con reintento y vacío en ambas pantallas y en el historial.
- [x] Pruebas unitarias de servicios HTTP, filtros, selección, validaciones de archivo, diálogo de
      validación, páginas y fixtures de comisiones, pagos y deudores.
- [x] E2E real: la comisión generada al confirmar la conformidad se paga con comprobante, se
      consulta el comprobante autenticado, se valida desde administración, desaparece de deudores
      y el técnico ve el pago validado y su saldo en cero.

### Criterios de cierre

- [x] Build de producción, lint y formato sin errores.
- [x] 393 pruebas unitarias en 57 archivos, todas en verde.
- [x] 20 pruebas E2E en verde en Chromium y móvil de 360 px con el backend local.
- [x] Axe sin violaciones en comisiones, historial, diálogos y pantalla administrativa.
- [x] Flujo real de pago de comisión y validación administrativa verificado contra la API.

## 13. Fase 9 — Administración de catálogos, parámetros y reportes ⏳

- [ ] CRUD de tipos de equipo, tipos de servicio, especialidades y distritos.
- [ ] Activación/desactivación de catálogos.
- [ ] Parámetros del sistema con validación.
- [ ] Dashboard administrativo con indicadores.
- [ ] Reportes y exportación Excel.
- [ ] Auditoría con filtros y paginación.
- [ ] Pruebas de formularios y E2E de catálogos.

## 14. Fase 10 — Notificaciones y perfil ⏳

- [ ] Centro de notificaciones con no leídas y “leer todas”.
- [ ] Badge de notificaciones en el layout.
- [ ] Perfil de usuario de solo lectura.
- [ ] Cierre de sesión por expiración con aviso accesible.
- [ ] Pruebas de polling/refresco y E2E.

> Brecha: no hay endpoints de edición del perfil de usuario general (el perfil profesional del
> técnico sí es editable en Fase 4), cambio de contraseña ni recuperación de contraseña. No se
> deben crear pantallas que prometan esas funciones.

## 15. Fase 11 — Endurecimiento UX, rendimiento y seguridad ⏳

- [ ] Revisión de todos los estados: carga, vacío, error, sin permisos y offline.
- [ ] Revisión de contraste, foco, teclado, lectores de pantalla y textos alternativos.
- [ ] Revisión de rendimiento: presupuestos, lazy loading, imágenes y fuentes.
- [ ] Revisión de seguridad: XSS, open redirect, manejo de tokens y errores.
- [ ] Documentar limitaciones de `sessionStorage`.
- [ ] Pruebas de regresión visual en 360, 768 y 1280 px.

## 16. Fase 12 — QA final y despliegue ⏳

- [ ] Suite completa: unitarias, E2E, Axe y build de producción.
- [ ] Datos semilla para E2E con cliente, técnico aprobado y administrador.
- [ ] Prueba de humo contra backend desplegado.
- [ ] Documentación de despliegue (Nginx, variables, CORS y `/api`).
- [ ] Checklist de aceptación por rol.
- [ ] Cierre del proyecto y acta de conformidad.

## 17. Brechas de API conocidas

El registro completo, con impacto y decisión provisional, está en
[`BRECHAS_PENDIENTES.md`](./BRECHAS_PENDIENTES.md). Se resolverán al final del proyecto. Entre las
principales están los documentos de verificación sin controlador, la recuperación/cambio de
contraseña, la búsqueda pública de técnicos, las fotos no reemplazables en la edición de
solicitudes, la edición del perfil de usuario general, la ausencia de seed/limpieza para E2E y la
mensajería sin tiempo real.

| Necesidad                          | Situación                                                    | Decisión                                                                                  |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Perfil del usuario autenticado     | Implementado `GET /api/auth/me`                              | Usar en toda la sesión                                                                    |
| Listado de técnicos para admin     | Implementado `GET /api/admin/tecnicos`                       | Usar `id` para verificar y `usuarioId` para usuarios                                      |
| Edición de perfil/foto del técnico | Implementado `PUT /api/perfil/tecnico` y `POST /perfil/foto` | Editar reinicia la verificación; la foto no                                               |
| Fotos en edición de solicitud      | `PUT /api/solicitudes/{id}` solo actualiza datos             | Adjuntar fotos únicamente al crear                                                        |
| Datos de prueba E2E                | Sin seed específico ni limpieza                              | Los E2E crean cuentas y solicitudes únicas; requieren backend y MySQL con `E2E_BACKEND=1` |

## 18. Convenciones de implementación

- Componentes standalone, `ChangeDetectionStrategy.OnPush` por defecto en Angular 22 (no se
  declara explícitamente) y signals para estado local.
- `input()`/`output()` en componentes reutilizables; evitar decoradores legacy.
- Formularios reactivos tipados con `NonNullableFormBuilder`.
- Control de flujo moderno (`@if`, `@for`, `@switch`) en plantillas.
- Sin `any`. Los errores se modelan con `ApiError`.
- Rutas lazy por funcionalidad y `title` en cada ruta.
- Nombres de archivos en kebab-case; clases en PascalCase; textos de interfaz en español.
- Accesibilidad: etiquetas explícitas, foco visible, contraste AA, navegación por teclado y
  mensajes de error anunciados.
- Cada fase debe actualizar este documento y dejar evidencia de build, test y lint.

## 19. Registro de avances

| Fecha      | Fase  | Evidencia                                                                                                                                                                                                        |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-27 | 0 y 1 | Build de producción, 21 pruebas unitarias, lint, Prettier y 8 pruebas E2E con Axe en escritorio y 360 px; login real contra backend verificado                                                                   |
| 2026-10-27 | 2     | Build de producción, 53 pruebas unitarias, lint y Prettier; 10 pruebas E2E con Axe en escritorio y 360 px; aprobación real de un técnico creado vía API y estado verificado con `GET /api/admin/tecnicos`        |
| 2026-10-27 | 3     | Build de producción, 73 pruebas unitarias, lint y Prettier; 12 pruebas E2E con Axe en escritorio y 360 px; registro real de un técnico, login y perfil `PENDIENTE` verificado desde la interfaz                  |
| 2026-10-27 | 4     | Build de producción, 128 pruebas unitarias, lint y Prettier; 14 pruebas E2E con Axe en escritorio y 360 px; perfil técnico editable con foto autorizada y solicitud real con foto creada, editada y cancelada    |
| 2026-10-27 | 5     | Build de producción, 192 pruebas unitarias en 31 archivos, lint y Prettier; 16 pruebas E2E con Axe en escritorio y 360 px; oferta, contraoferta y creación real del servicio verificadas contra la API           |
| 2026-10-27 | 6     | Build de producción, 270 pruebas unitarias en 42 archivos, lint y Prettier; 18 pruebas E2E con Axe en escritorio y 360 px; aceptación, ejecución, ajuste y conformidad verificados contra la API                 |
| 2026-10-27 | 7     | Build de producción, 358 pruebas unitarias en 52 archivos, lint y Prettier; 20 pruebas E2E con Axe en escritorio y 360 px; constancias de taller, reseña, moderación, reclamo y cierre verificados contra la API |
