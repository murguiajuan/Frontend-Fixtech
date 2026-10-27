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
| 3    | Registro y perfil de técnico                           | ⏳ Pendiente  |
| 4    | Cliente: solicitudes y adjuntos                        | ⏳ Pendiente  |
| 5    | Técnico: solicitudes disponibles y ofertas             | ⏳ Pendiente  |
| 6    | Negociación y ejecución del servicio                   | ⏳ Pendiente  |
| 7    | Cierre, constancias, reseñas y reclamos                | ⏳ Pendiente  |
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

## 7. Fase 3 — Registro y perfil de técnico ⏳

- [ ] Formulario de registro de técnico con datos personales, modalidades y especialidades.
- [ ] Catálogos públicos: especialidades y distritos.
- [ ] Validación de al menos una modalidad y dirección de taller cuando aplique.
- [ ] Pantalla de perfil técnico y estado de verificación.
- [ ] Mensajes claros para `PENDIENTE`, `OBSERVADO` y `RECHAZADO`.
- [ ] Pruebas de formulario y E2E de registro.

> Brecha: no existen endpoints para subir documentos de verificación ni editar el perfil o la
> foto. La tabla `documento_tecnico` existe, pero no hay controlador expuesto.

## 8. Fase 4 — Cliente: solicitudes y adjuntos ⏳

- [ ] Crear solicitud multipart con tipo de equipo, tipo de servicio, modalidad y fotos.
- [ ] Listar “mis solicitudes” con estados, paginación visual y estados vacío/error.
- [ ] Ver detalle, editar y cancelar solicitudes permitidas.
- [ ] Visualizar imágenes mediante endpoints autorizados.
- [ ] Validaciones de archivos: tamaño, cantidad y tipo.
- [ ] Pruebas de formulario, estados y E2E de creación.

## 9. Fase 5 — Técnico: solicitudes y ofertas ⏳

- [ ] Listar solicitudes disponibles solo para técnicos aprobados y no bloqueados.
- [ ] Ver detalle de solicitud y enviar oferta con precio, movilidad, diagnóstico, tiempo y
      garantía.
- [ ] Editar o retirar ofertas propias.
- [ ] Comparar ofertas y responder contraofertas.
- [ ] Gating real con `tecnicoAprobadoGuard` y mensajes de deuda.
- [ ] Pruebas de permisos y E2E de oferta.

> Importante: `OfertaResponse.precioTotal` y `Servicio.montoTotal` ya excluyen
> `costoDiagnostico`. El frontend no debe volver a sumarlo.

## 10. Fase 6 — Negociación y ejecución ⏳

- [ ] Bandeja de negociación cliente/técnico con contraofertas y aceptación.
- [ ] Detalle del servicio con estado, fechas, pin de inicio y contacto.
- [ ] Avances con fotos y descripción.
- [ ] Mensajería del servicio.
- [ ] Ajustes de precio con evidencia y respuesta.
- [ ] Finalización y conformidad del cliente.
- [ ] Pruebas de estados y E2E del flujo completo.

## 11. Fase 7 — Cierre, constancias, reseñas y reclamos ⏳

- [ ] Constancia de servicio con fotos y confirmación.
- [ ] Reseña del cliente y respuesta del técnico.
- [ ] Reporte de reseñas.
- [ ] Reclamo con fotos, respuesta y seguimiento.
- [ ] Estados vacíos y errores de conflicto.
- [ ] Pruebas de permisos y E2E de cierre.

## 12. Fase 8 — Comisiones y pagos ⏳

- [ ] Saldo de comisiones del técnico.
- [ ] Historial de pagos y comprobantes.
- [ ] Registro de pago multipart con número de operación.
- [ ] Validación administrativa de pagos y deudores.
- [ ] Aviso de bloqueo por deuda y enlaces a regularización.
- [ ] Pruebas de carga de archivos y E2E.

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

> Brecha: no hay endpoints de edición de perfil, cambio de contraseña ni recuperación de
> contraseña. No se deben crear pantallas que prometan esas funciones.

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

| Necesidad                           | Situación                              | Decisión                                                                                            |
| ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Perfil del usuario autenticado      | Implementado `GET /api/auth/me`        | Usar en toda la sesión                                                                              |
| Listado de técnicos para admin      | Implementado `GET /api/admin/tecnicos` | Usar `id` para verificar y `usuarioId` para usuarios                                                |
| Documentos de verificación          | Tabla sin controlador                  | No implementar carga hasta habilitar endpoints                                                      |
| Edición de perfil/foto              | Sin endpoints                          | Solo lectura                                                                                        |
| Recuperación/cambio de contraseña   | Sin endpoints                          | No mostrar enlaces                                                                                  |
| Búsqueda/perfil público de técnicos | Sin endpoint                           | Posponer                                                                                            |
| Datos de prueba E2E                 | Sin seed específico                    | La prueba de aprobación crea un técnico único vía API; requiere backend y MySQL con `E2E_BACKEND=1` |

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

| Fecha      | Fase  | Evidencia                                                                                                                                                                                                 |
| ---------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-27 | 0 y 1 | Build de producción, 21 pruebas unitarias, lint, Prettier y 8 pruebas E2E con Axe en escritorio y 360 px; login real contra backend verificado                                                            |
| 2026-10-27 | 2     | Build de producción, 53 pruebas unitarias, lint y Prettier; 10 pruebas E2E con Axe en escritorio y 360 px; aprobación real de un técnico creado vía API y estado verificado con `GET /api/admin/tecnicos` |
