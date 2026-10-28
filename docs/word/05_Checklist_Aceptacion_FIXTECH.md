---
titulo: Checklist de aceptación por rol
subtitulo: FIXTECH — Plataforma web de soporte y mantenimiento tecnológico
tipo: Checklist de aceptación
codigo: FIXTECH-CHK-001
version: 1.0
fecha: Octubre de 2026
autor: Juan Jesús Murguía Rivera
curso: Calidad de Software
---

## 1. Instrucciones

Este checklist permite verificar la aceptación funcional de FIXTECH por rol. Cada criterio debe marcarse como **Cumple**, **Cumple con observación** o **No cumple**. La columna **Evidencia** indica la prueba, el documento o la verificación manual que respalda el resultado.

Antes de ejecutar el checklist:

1. Confirmar que el backend y la base de datos están activos.
2. Ejecutar `npm run e2e:seed` para preparar las cuentas de prueba.
3. Ejecutar `E2E_BACKEND=1 npx playwright test`.
4. Ejecutar la prueba de humo contra el despliegue.
5. Registrar los resultados en las tablas siguientes.

## 2. Datos de la prueba

| Elemento             | Valor                                    |
| -------------------- | ---------------------------------------- |
| Fecha de ejecución   | Octubre de 2026                          |
| Versión evaluada     | 1.0                                      |
| Frontend             | Angular 22                               |
| Backend              | Spring Boot 4.1.1                        |
| Navegador            | Chromium                                 |
| Viewports            | 1280 px y 360 px                         |
| Backend local        | `http://localhost:8082/api`              |
| Despliegue de prueba | `http://127.0.0.1:8083`                  |
| Administrador        | `admin@fixtech.pe` / `Admin123!`         |
| Cliente              | `cliente.e2e@fixtech.pe` / `Cliente123!` |
| Técnico              | `tecnico.e2e@fixtech.pe` / `Tecnico123!` |

## 3. Checklist general

| N.º | Criterio                                          | Evidencia                                | Resultado              |
| --: | ------------------------------------------------- | ---------------------------------------- | ---------------------- |
|   1 | El build de producción compila sin errores        | `npm run build`                          | Cumple                 |
|   2 | El bundle inicial respeta el presupuesto          | 604.53 kB < 650 kB                       | Cumple                 |
|   3 | Las pruebas unitarias pasan                       | 501 pruebas; 0 fallos                    | Cumple                 |
|   4 | Las pruebas E2E pasan                             | 54 ejecuciones; 51 aprobadas; 3 omitidas | Cumple con observación |
|   5 | Axe no reporta violaciones                        | 0 violaciones                            | Cumple                 |
|   6 | ESLint no reporta errores                         | `npm run lint`                           | Cumple                 |
|   7 | Prettier no reporta diferencias                   | `npm run format:check`                   | Cumple                 |
|   8 | La SPA carga desde Nginx                          | `GET /` = 200                            | Cumple                 |
|   9 | El fallback de la SPA funciona                    | `GET /login` y ruta inexistente = 200    | Cumple                 |
|  10 | El proxy `/api` funciona                          | `GET /api/catalogos/distritos` = 200     | Cumple                 |
|  11 | Las fuentes locales cargan                        | Roboto y Material Symbols = 200          | Cumple                 |
|  12 | Las cabeceras de seguridad están presentes        | `smoke-test.sh`                          | Cumple                 |
|  13 | El login administrativo funciona en el despliegue | Playwright contra 8083                   | Cumple                 |
|  14 | No hay errores en la consola del navegador        | Playwright; 0 errores                    | Cumple                 |
|  15 | La configuración de Docker Compose es válida      | `docker-compose config`                  | Cumple                 |
|  16 | La imagen Docker se construyó y ejecutó           | No ejecutada por permisos del daemon     | No cumple              |

## 4. Checklist del cliente

| N.º | Criterio                                           | Evidencia                       | Resultado |
| --: | -------------------------------------------------- | ------------------------------- | --------- |
|   1 | El cliente puede registrarse                       | `acceso.spec.ts`                | Cumple    |
|   2 | El cliente puede iniciar sesión                    | `login-real.spec.ts`            | Cumple    |
|   3 | El cliente ve el panel de inicio                   | Manual / E2E                    | Cumple    |
|   4 | El cliente puede crear una solicitud               | `solicitudes-cliente.spec.ts`   | Cumple    |
|   5 | La solicitud admite fotos                          | `solicitudes-cliente.spec.ts`   | Cumple    |
|   6 | La solicitud valida campos obligatorios            | Pruebas unitarias               | Cumple    |
|   7 | El cliente puede editar una solicitud              | `solicitudes-cliente.spec.ts`   | Cumple    |
|   8 | El cliente puede cancelar una solicitud            | `solicitudes-cliente.spec.ts`   | Cumple    |
|   9 | El cliente puede buscar y filtrar sus solicitudes  | `solicitudes-cliente.spec.ts`   | Cumple    |
|  10 | El cliente ve las ofertas recibidas                | `ofertas-negociacion.spec.ts`   | Cumple    |
|  11 | El cliente puede comparar ofertas                  | `ofertas-negociacion.spec.ts`   | Cumple    |
|  12 | El cliente puede aceptar una oferta                | `ofertas-negociacion.spec.ts`   | Cumple    |
|  13 | El cliente puede solicitar una contraoferta        | `ofertas-negociacion.spec.ts`   | Cumple    |
|  14 | El cliente ve el servicio creado                   | `servicios-flujo.spec.ts`       | Cumple    |
|  15 | El cliente puede enviar mensajes                   | `servicios-flujo.spec.ts`       | Cumple    |
|  16 | El cliente puede aprobar un ajuste de precio       | `servicios-flujo.spec.ts`       | Cumple    |
|  17 | El cliente puede confirmar una constancia          | `servicios-flujo.spec.ts`       | Cumple    |
|  18 | El cliente puede dar conformidad                   | `servicios-flujo.spec.ts`       | Cumple    |
|  19 | El cliente puede publicar una reseña               | `servicios-flujo.spec.ts`       | Cumple    |
|  20 | El cliente puede registrar un reclamo              | `servicios-flujo.spec.ts`       | Cumple    |
|  21 | El cliente puede consultar el estado del reclamo   | `servicios-flujo.spec.ts`       | Cumple    |
|  22 | El cliente puede consultar notificaciones          | `notificaciones-perfil.spec.ts` | Cumple    |
|  23 | El cliente puede marcar notificaciones como leídas | `notificaciones-perfil.spec.ts` | Cumple    |
|  24 | El cliente ve su cuenta en modo de solo lectura    | `notificaciones-perfil.spec.ts` | Cumple    |
|  25 | El cliente puede cerrar sesión                     | Manual / E2E                    | Cumple    |
|  26 | El cliente puede recuperar su contraseña           | No hay endpoint                 | No aplica |
|  27 | El cliente puede editar su perfil general          | No hay endpoint                 | No aplica |

## 5. Checklist del técnico

| N.º | Criterio                                        | Evidencia                       | Resultado |
| --: | ----------------------------------------------- | ------------------------------- | --------- |
|   1 | El técnico puede registrarse                    | `registro-tecnico.spec.ts`      | Cumple    |
|   2 | El registro exige especialidad y distrito       | `registro-tecnico.spec.ts`      | Cumple    |
|   3 | El técnico queda en estado pendiente            | `registro-tecnico.spec.ts`      | Cumple    |
|   4 | El técnico puede iniciar sesión                 | `login-real.spec.ts`            | Cumple    |
|   5 | El técnico puede editar su perfil profesional   | `registro-tecnico.spec.ts`      | Cumple    |
|   6 | El técnico puede cambiar su foto                | `registro-tecnico.spec.ts`      | Cumple    |
|   7 | El técnico aprobado ve solicitudes disponibles  | `ofertas-negociacion.spec.ts`   | Cumple    |
|   8 | El técnico no aprobado no ve solicitudes        | Guard y pruebas unitarias       | Cumple    |
|   9 | El técnico bloqueado por deuda no puede ofertar | Guard y pruebas unitarias       | Cumple    |
|  10 | El técnico puede enviar una oferta              | `ofertas-negociacion.spec.ts`   | Cumple    |
|  11 | El técnico puede editar su oferta               | `ofertas-negociacion.spec.ts`   | Cumple    |
|  12 | El técnico puede retirar su oferta              | `ofertas-negociacion.spec.ts`   | Cumple    |
|  13 | El técnico puede responder una contraoferta     | `ofertas-negociacion.spec.ts`   | Cumple    |
|  14 | El técnico ve el servicio aceptado              | `servicios-flujo.spec.ts`       | Cumple    |
|  15 | El técnico puede validar el PIN de inicio       | `servicios-flujo.spec.ts`       | Cumple    |
|  16 | El técnico puede cambiar el estado del servicio | `servicios-flujo.spec.ts`       | Cumple    |
|  17 | El técnico puede registrar avances con fotos    | `servicios-flujo.spec.ts`       | Cumple    |
|  18 | El técnico puede enviar mensajes                | `servicios-flujo.spec.ts`       | Cumple    |
|  19 | El técnico puede proponer un ajuste de precio   | `servicios-flujo.spec.ts`       | Cumple    |
|  20 | El técnico puede registrar constancias          | `servicios-flujo.spec.ts`       | Cumple    |
|  21 | El técnico puede finalizar el servicio          | `servicios-flujo.spec.ts`       | Cumple    |
|  22 | El técnico puede responder una reseña           | `servicios-flujo.spec.ts`       | Cumple    |
|  23 | El técnico puede responder un reclamo           | `servicios-flujo.spec.ts`       | Cumple    |
|  24 | El técnico puede consultar sus comisiones       | Manual / E2E                    | Cumple    |
|  25 | El técnico puede registrar un pago              | Manual / E2E                    | Cumple    |
|  26 | El técnico puede adjuntar un comprobante        | Manual / E2E                    | Cumple    |
|  27 | El técnico puede consultar notificaciones       | `notificaciones-perfil.spec.ts` | Cumple    |
|  28 | El técnico puede cerrar sesión                  | Manual / E2E                    | Cumple    |

## 6. Checklist del administrador

| N.º | Criterio                                                    | Evidencia                       | Resultado |
| --: | ----------------------------------------------------------- | ------------------------------- | --------- |
|   1 | El administrador puede iniciar sesión                       | `login-real.spec.ts`            | Cumple    |
|   2 | El administrador ve el panel de indicadores                 | Manual / E2E                    | Cumple    |
|   3 | El administrador puede buscar técnicos                      | `admin-verificacion.spec.ts`    | Cumple    |
|   4 | El administrador puede filtrar técnicos por estado          | `admin-verificacion.spec.ts`    | Cumple    |
|   5 | El administrador puede aprobar un técnico                   | `admin-verificacion.spec.ts`    | Cumple    |
|   6 | El administrador puede observar o rechazar con motivo       | Pruebas unitarias               | Cumple    |
|   7 | El administrador puede buscar usuarios                      | `admin-modulos.spec.ts`         | Cumple    |
|   8 | El administrador puede suspender un usuario                 | Pruebas unitarias               | Cumple    |
|   9 | El administrador puede reactivar un usuario                 | Pruebas unitarias               | Cumple    |
|  10 | El administrador puede moderar reseñas                      | `admin-modulos.spec.ts`         | Cumple    |
|  11 | El administrador puede gestionar reclamos                   | `admin-modulos.spec.ts`         | Cumple    |
|  12 | El administrador puede ver comprobantes de pago             | Manual / E2E                    | Cumple    |
|  13 | El administrador puede validar un pago                      | Manual / E2E                    | Cumple    |
|  14 | El administrador puede consultar deudores                   | Manual / E2E                    | Cumple    |
|  15 | El administrador puede crear tipos de equipo                | `admin-catalogos.spec.ts`       | Cumple    |
|  16 | El administrador puede editar tipos de equipo               | `admin-catalogos.spec.ts`       | Cumple    |
|  17 | El administrador puede desactivar y reactivar catálogos     | `admin-catalogos.spec.ts`       | Cumple    |
|  18 | El administrador puede crear distritos                      | `admin-catalogos.spec.ts`       | Cumple    |
|  19 | El administrador puede editar parámetros                    | `admin-modulos.spec.ts`         | Cumple    |
|  20 | El administrador puede consultar reportes                   | `admin-modulos.spec.ts`         | Cumple    |
|  21 | El administrador puede exportar reportes a Excel            | `admin-modulos.spec.ts`         | Cumple    |
|  22 | El administrador puede consultar auditoría                  | `admin-modulos.spec.ts`         | Cumple    |
|  23 | El administrador puede consultar notificaciones             | `notificaciones-perfil.spec.ts` | Cumple    |
|  24 | El administrador puede cerrar sesión                        | Manual / E2E                    | Cumple    |
|  25 | El administrador puede anular un pago                       | No hay endpoint                 | No aplica |
|  26 | El administrador puede desbloquear manualmente a un técnico | No hay endpoint                 | No aplica |
|  27 | El administrador puede revisar documentos del técnico       | No hay controlador              | No aplica |
|  28 | El administrador puede eliminar catálogos                   | No hay `DELETE`                 | No aplica |

## 7. Checklist de seguridad y despliegue

| N.º | Criterio                                       | Evidencia                     | Resultado |
| --: | ---------------------------------------------- | ----------------------------- | --------- |
|   1 | La SPA y la API comparten origen en producción | `apiUrl: '/api'`              | Cumple    |
|   2 | El backend recibe el origen público en CORS    | `FIXTECH_CORS_ORIGINS`        | Cumple    |
|   3 | El token no se guarda en `localStorage`        | `sessionStorage`              | Cumple    |
|   4 | El `returnUrl` solo acepta rutas internas      | `seguridad.spec.ts`           | Cumple    |
|   5 | Un rol sin permisos llega a `/no-autorizado`   | `seguridad.spec.ts`           | Cumple    |
|   6 | El aviso de conexión aparece dentro de la app  | `seguridad.spec.ts`           | Cumple    |
|   7 | La CSP permite el script inline de Angular     | Hash SHA-256                  | Cumple    |
|   8 | La CSP bloquea scripts externos                | `script-src 'self'`           | Cumple    |
|   9 | Las cabeceras de seguridad están activas       | `smoke-test.sh`               | Cumple    |
|  10 | `index.html` no se cachea                      | `expires -1`                  | Cumple    |
|  11 | Los archivos con hash se cachean un año        | `expires 1y`                  | Cumple    |
|  12 | La compresión gzip está activa                 | `gzip on`                     | Cumple    |
|  13 | El backend no se expone al host en Docker      | Sin puerto publicado          | Cumple    |
|  14 | MySQL no se expone al host en Docker           | Sin puerto publicado          | Cumple    |
|  15 | El secreto JWT se define por variable          | `.env`                        | Cumple    |
|  16 | Swagger está deshabilitado en producción       | `application-prod.properties` | Cumple    |
|  17 | La prueba de humo pasa completa                | 14 comprobaciones             | Cumple    |
|  18 | El procedimiento de reversión está documentado | Manual de despliegue          | Cumple    |
|  19 | La copia de seguridad se probó                 | Reporte backend               | Cumple    |
|  20 | La imagen Docker se construyó y ejecutó        | Permisos del daemon           | No cumple |

## 8. Resumen de resultados

| Bloque                 | Criterios |  Cumple | Observado | No aplica | No cumple |
| ---------------------- | --------: | ------: | --------: | --------: | --------: |
| General                |        16 |      15 |         0 |         0 |         1 |
| Cliente                |        27 |      25 |         0 |         2 |         0 |
| Técnico                |        28 |      28 |         0 |         0 |         0 |
| Administrador          |        28 |      24 |         0 |         4 |         0 |
| Seguridad y despliegue |        20 |      19 |         0 |         0 |         1 |
| **Total**              |   **119** | **111** |     **0** |     **6** |     **2** |

Los dos criterios no cumplidos corresponden a la construcción y ejecución de la imagen Docker, que no pudo realizarse en el entorno de desarrollo por permisos del daemon. La configuración fue validada con `docker-compose config`. Los seis criterios no aplicables corresponden a funcionalidades que el backend no expone y que se documentaron como brechas.

## 9. Observaciones

1. Las 3 comparaciones visuales omitidas en el proyecto móvil no representan fallos; las capturas de referencia se generaron para escritorio.
2. La imagen Docker no se construyó por permisos del daemon. Se recomienda ejecutar la pila en un host con Docker operativo antes de la puesta en producción.
3. La recuperación y el cambio de contraseña, la edición del perfil general, la anulación de pagos, el desbloqueo manual, los documentos de verificación y el borrado de catálogos no están disponibles en el backend.
4. La sesión en `sessionStorage` es una limitación aceptada del MVP.
5. La accesibilidad se verificó con Axe; se recomienda una auditoría manual con lectores de pantalla.

## 10. Conformidad

| Rol                       | Nombre | Firma | Fecha |
| ------------------------- | ------ | ----- | ----- |
| Responsable del proyecto  |        |       |       |
| Representante del cliente |        |       |       |
| Responsable de calidad    |        |       |       |
| Administrador del sistema |        |       |       |

El presente checklist se adjunta al Acta de conformidad de FIXTECH y forma parte de la evidencia de aceptación del proyecto.
