---
titulo: Informe final de aseguramiento de la calidad
subtitulo: FIXTECH — Plataforma web de soporte y mantenimiento tecnológico
tipo: Informe de calidad
codigo: FIXTECH-QA-001
version: 1.0
fecha: Octubre de 2026
autor: Juan Jesús Murguía Rivera
curso: Calidad de Software
---

## 1. Resumen ejecutivo

El presente informe documenta el cierre de la Fase 12 del proyecto FIXTECH, correspondiente a la verificación final de calidad, la documentación técnica y el despliegue de la aplicación. FIXTECH es una plataforma web que conecta a clientes de Piura con técnicos verificados para la atención de solicitudes de soporte, mantenimiento y reparación de equipos tecnológicos. La solución se compone de una SPA desarrollada en Angular 22 y de una API REST construida con Spring Boot 4.1.1 y MySQL 8.

La verificación se ejecutó sobre el repositorio frontend y el repositorio backend del proyecto. Se aplicaron controles automatizados y manuales: compilación de producción, pruebas unitarias, pruebas de extremo a extremo, análisis de accesibilidad con Axe, revisión estática con ESLint, verificación de formato con Prettier, prueba de humo contra un despliegue real con Nginx, revisión de cabeceras de seguridad, validación de la configuración de Docker Compose y contraste con la documentación OpenAPI del backend.

Los resultados principales se resumen en la Tabla 1. El frontend cerró con 501 pruebas unitarias aprobadas, 54 ejecuciones de extremo a extremo (51 aprobadas y 3 comparaciones visuales omitidas en la vista móvil), cero violaciones de accesibilidad en las pantallas evaluadas, build de producción de 604.53 kB iniciales y una prueba de humo con 14 comprobaciones correctas. El backend cerró con 337 pruebas automatizadas sin fallos, 94.00 % de cobertura de líneas en el paquete de servicios, 87.08 % de cobertura global, 84 rutas y 98 operaciones documentadas en OpenAPI, prueba de carga con percentil 95 de 103 ms y cero errores, y análisis OWASP ZAP sin alertas altas, medias ni bajas.

| Verificación                      | Resultado                                       | Estado                 |
| --------------------------------- | ----------------------------------------------- | ---------------------- |
| Build de producción del frontend  | 604.53 kB iniciales; 146.40 kB de transferencia | Cumple                 |
| Pruebas unitarias del frontend    | 501 pruebas en 77 archivos; 0 fallos            | Cumple                 |
| Pruebas E2E del frontend          | 54 ejecuciones; 51 aprobadas; 3 omitidas        | Cumple con observación |
| Accesibilidad con Axe             | 0 violaciones en las pantallas evaluadas        | Cumple                 |
| ESLint y Prettier                 | Sin errores                                     | Cumple                 |
| Prueba de humo con Nginx          | 14 comprobaciones correctas                     | Cumple                 |
| Pruebas automatizadas del backend | 337 pruebas; 0 fallos                           | Cumple                 |
| Cobertura del backend             | 94.00 % servicios; 87.08 % global               | Cumple                 |
| Documentación OpenAPI             | 84 rutas; 98 operaciones                        | Cumple                 |
| Carga con JMeter                  | p95 = 103 ms; 0 errores                         | Cumple                 |
| Seguridad con OWASP ZAP           | 0 altas, 0 medias, 0 bajas                      | Cumple                 |
| Docker Compose                    | Configuración validada; imagen no construida    | Parcial                |
| Acta de conformidad               | Pendiente de firma de los involucrados          | Pendiente              |

El equipo concluye que FIXTECH se encuentra apto para la aceptación funcional y técnica del alcance comprometido, con observaciones documentadas que no bloquean la entrega. Las observaciones se refieren a brechas de API previamente registradas, a la limitación de `sessionStorage` para el almacenamiento del token, a la imposibilidad de construir la imagen Docker en el entorno de desarrollo por permisos del daemon y a la pendiente firma del acta de conformidad.

## 2. Información del proyecto

| Elemento             | Detalle                                                         |
| -------------------- | --------------------------------------------------------------- |
| Nombre del proyecto  | FIXTECH — Plataforma web de soporte y mantenimiento tecnológico |
| Tipo de documento    | Informe final de aseguramiento de la calidad                    |
| Código               | FIXTECH-QA-001                                                  |
| Versión              | 1.0                                                             |
| Fecha de cierre      | Octubre de 2026                                                 |
| Autor                | Juan Jesús Murguía Rivera                                       |
| Curso                | Calidad de Software                                             |
| Componente evaluado  | Frontend Angular 22 y backend Spring Boot 4.1.1                 |
| Repositorio frontend | `fixtech-frontend`                                              |
| Repositorio backend  | `CalidadSoftware`                                               |
| Ciudad               | Piura, Perú                                                     |

## 3. Alcance y objetivos

### 3.1 Alcance

La verificación cubrió los siguientes aspectos:

- Compilación de producción de la SPA con optimización, presupuestos de tamaño y reemplazo de entorno.
- Pruebas unitarias de componentes, servicios, guards, interceptores y utilidades.
- Pruebas de extremo a extremo en escritorio y en viewport móvil de 360 px.
- Accesibilidad automatizada con Axe en las pantallas principales y en los flujos críticos.
- Revisión estática con ESLint y verificación de formato con Prettier.
- Prueba de humo contra un despliegue real servido por Nginx, con proxy `/api` hacia el backend.
- Validación de cabeceras de seguridad, política de contenido y caché de archivos estáticos.
- Validación de la configuración de Docker Compose para frontend, backend y MySQL.
- Contraste de los contratos consumidos con la documentación OpenAPI del backend.
- Revisión de la evidencia de pruebas, cobertura, carga y seguridad del backend.

### 3.2 Objetivo general

Verificar que la versión de cierre de FIXTECH cumpla los criterios de calidad, seguridad, accesibilidad, rendimiento y despliegue definidos para el proyecto, y dejar constancia documental de los resultados obtenidos.

### 3.3 Objetivos específicos

1. Confirmar que el build de producción se genera sin errores y dentro de los presupuestos definidos.
2. Confirmar que las pruebas unitarias y de extremo a extremo se ejecutan sin fallos.
3. Confirmar que la interfaz cumple los criterios de accesibilidad WCAG AA evaluados con Axe.
4. Confirmar que el despliegue con Nginx sirve la SPA, los recursos estáticos y el proxy `/api` correctamente.
5. Confirmar que la configuración de Docker Compose es válida y reproducible.
6. Documentar las brechas, riesgos y limitaciones que permanecen al cierre.
7. Dejar constancia de la aceptación mediante el checklist por rol y el acta de conformidad.

### 3.4 Fuera de alcance

- Pruebas de penetración manuales sobre infraestructura de producción.
- Monitoreo de disponibilidad y observabilidad en un entorno cloud real.
- Pruebas de usabilidad con usuarios finales externos.
- Migración de datos históricos de otros sistemas.
- Implementación de funcionalidades que dependen de endpoints no disponibles en el backend.
- Certificación formal de accesibilidad por un auditor externo.

## 4. Metodología

### 4.1 Enfoque de trabajo

El proyecto se desarrolló por fases incrementales. Cada fase se cerró únicamente cuando el build, las pruebas, el lint, el formato y las pruebas de accesibilidad se encontraron en verde. La Fase 12 concentró la verificación final, la documentación y el despliegue. La Tabla 2 presenta las fases ejecutadas.

| Fase | Alcance                                                | Estado                       |
| ---- | ------------------------------------------------------ | ---------------------------- |
| 0    | Base técnica, tooling y sistema de diseño              | Completada                   |
| 1    | Autenticación, sesión, guards, interceptores y layouts | Completada                   |
| 2    | Panel administrativo de técnicos y usuarios            | Completada                   |
| 3    | Registro y perfil del técnico                          | Completada                   |
| 4    | Solicitudes del cliente y adjuntos                     | Completada                   |
| 5    | Solicitudes disponibles y ofertas del técnico          | Completada                   |
| 6    | Servicios: aceptación y ejecución                      | Completada                   |
| 7    | Cierre, constancias, reseñas y reclamos                | Completada                   |
| 8    | Comisiones y pagos del técnico                         | Completada                   |
| 9    | Catálogos, parámetros, reportes y auditoría            | Completada                   |
| 10   | Notificaciones y perfil de usuario                     | Completada                   |
| 11   | Endurecimiento de UX, rendimiento y seguridad          | Completada                   |
| 12   | QA final, documentación y despliegue                   | Completada con observaciones |

### 4.2 Criterios de aceptación

Se establecieron los siguientes criterios de cierre:

- El build de producción compila sin errores y respeta los presupuestos de `angular.json`.
- Las pruebas unitarias se ejecutan en una sola pasada y no presentan fallos.
- Las pruebas E2E se ejecutan en escritorio y en 360 px; las que requieren backend se ejecutan con `E2E_BACKEND=1`.
- Axe no reporta violaciones en las pantallas evaluadas.
- ESLint y Prettier no reportan errores.
- La prueba de humo contra el despliegue devuelve código 200 en la SPA, los recursos y el proxy `/api`.
- Las cabeceras de seguridad están presentes en las respuestas.
- La configuración de Docker Compose es válida.
- La documentación de cierre está completa y es trazable a la evidencia.

### 4.3 Herramientas utilizadas

| Herramienta              | Versión            | Uso                                          |
| ------------------------ | ------------------ | -------------------------------------------- |
| Node.js                  | 22.23.4            | Ejecución del frontend y de las herramientas |
| npm                      | 10.9.9             | Gestión de dependencias y scripts            |
| Angular CLI              | 22.2.4             | Build, desarrollo y pruebas                  |
| TypeScript               | 5.9                | Tipado estricto                              |
| Vitest                   | 4.x                | Pruebas unitarias                            |
| Playwright               | 1.64.1             | Pruebas E2E y capturas visuales              |
| Axe Core para Playwright | 4.14.0             | Accesibilidad automatizada                   |
| ESLint                   | 10.12.0            | Análisis estático                            |
| Prettier                 | 3.8.1              | Formato de código                            |
| Nginx                    | 1.24.0             | Servidor web y proxy inverso                 |
| Docker Compose           | 1.29.2             | Orquestación local                           |
| Java                     | OpenJDK 21.0.12.1  | Ejecución del backend                        |
| Spring Boot              | 4.1.1              | API REST                                     |
| MySQL                    | 8.4 / MariaDB 10.4 | Persistencia                                 |
| JMeter                   | 5.6.3              | Prueba de carga                              |
| OWASP ZAP                | 2.16.1             | Análisis de seguridad                        |

### 4.4 Entorno de ejecución

| Elemento               | Detalle                                 |
| ---------------------- | --------------------------------------- |
| Sistema operativo      | Ubuntu 24.04                            |
| Arquitectura           | x86_64                                  |
| Memoria                | 7.1 GiB                                 |
| Procesadores           | 12 vCPU                                 |
| Navegador de pruebas   | Chromium (Playwright)                   |
| Backend local          | `http://localhost:8082/api`             |
| Frontend de desarrollo | `http://localhost:4200`                 |
| Despliegue de prueba   | `http://127.0.0.1:8083`                 |
| Base de datos          | MySQL 8 / MariaDB 10.4 con `fixtech_db` |

## 5. Resultados del frontend

### 5.1 Build de producción

El build se ejecutó con `npm run build`. La compilación finalizó sin errores y generó los artefactos en `dist/fixtech-frontend/browser`. La Tabla 5 presenta los tamaños principales.

| Archivo               | Tamaño bruto | Transferencia estimada |
| --------------------- | -----------: | ---------------------: |
| `main-J3AEK6XK.js`    |    296.58 kB |               60.83 kB |
| `chunk-B2RLpE8y.js`   |    295.87 kB |               82.99 kB |
| `styles-4CFHIN4Q.css` |     12.08 kB |                2.58 kB |
| Total inicial         |    604.53 kB |              146.40 kB |

El presupuesto de advertencia quedó en 650 kB y el de error en 750 kB para el bundle inicial. El resultado de 604.53 kB se mantiene por debajo de ambos umbrales. El total de bundles, incluyendo las rutas diferidas, también respeta los límites de 1.8 MB y 2 MB definidos en `angular.json`.

La carga diferida por ruta se mantiene. Los módulos de servicio, comisiones, solicitudes, perfil y administración se descargan solo cuando el usuario accede a la ruta correspondiente. Las fuentes Roboto y Material Symbols se sirven desde `public/fonts/`, sin peticiones a Google Fonts.

### 5.2 Pruebas unitarias

Las pruebas unitarias se ejecutaron con `npm test`, que invoca Vitest en modo de una sola pasada. La Tabla 6 resume el resultado.

| Métrica            | Resultado        |
| ------------------ | ---------------- |
| Archivos de prueba | 77               |
| Pruebas ejecutadas | 501              |
| Pruebas aprobadas  | 501              |
| Pruebas fallidas   | 0                |
| Framework          | Vitest con jsdom |

La cobertura funcional incluye autenticación, sesión, guards, interceptores, servicios de API, formularios, componentes de cada módulo, notificaciones, catálogos, reportes, comisiones, reseñas, reclamos y utilidades de formato. Las pruebas se ejecutan sin backend; los servicios HTTP se sustituyen por dobles de prueba.

### 5.3 Análisis estático y formato

| Verificación         | Comando                | Resultado       |
| -------------------- | ---------------------- | --------------- |
| ESLint               | `npm run lint`         | Sin errores     |
| Prettier             | `npm run format:check` | Sin diferencias |
| TypeScript estricto  | `npm run build`        | Sin errores     |
| Plantillas estrictas | `npm run build`        | Sin errores     |

El proyecto mantiene `strict`, `strictTemplates` y las reglas de `angular-eslint`. No se introdujeron excepciones ni supresiones en la Fase 12.

### 5.4 Pruebas de extremo a extremo

Las pruebas E2E se ejecutaron con Playwright en dos proyectos: `chromium` en escritorio y `mobile-360` con viewport de 360 × 800 px. La Tabla 8 resume las ejecuciones.

| Especificación                  | Enfoque                                     | Resultado                |
| ------------------------------- | ------------------------------------------- | ------------------------ |
| `acceso.spec.ts`                | Login, registro, 404 y validaciones         | Aprobado                 |
| `login-real.spec.ts`            | Login contra backend real                   | Aprobado                 |
| `registro-tecnico.spec.ts`      | Registro, perfil y foto del técnico         | Aprobado                 |
| `solicitudes-cliente.spec.ts`   | Alta, edición, cancelación y búsqueda       | Aprobado                 |
| `ofertas-negociacion.spec.ts`   | Ofertas, contraoferta y aceptación          | Aprobado                 |
| `servicios-flujo.spec.ts`       | Ejecución, mensajería, ajuste y conformidad | Aprobado                 |
| `admin-verificacion.spec.ts`    | Aprobación de técnico                       | Aprobado                 |
| `admin-catalogos.spec.ts`       | CRUD lógico de catálogos                    | Aprobado                 |
| `admin-modulos.spec.ts`         | Parámetros, reportes y auditoría            | Aprobado                 |
| `notificaciones-perfil.spec.ts` | Bandeja, badge, perfil y sesión             | Aprobado                 |
| `seguridad.spec.ts`             | Return URL, roles, tokens y offline         | Aprobado                 |
| `responsive.spec.ts`            | 360, 768 y 1280 px; capturas visuales       | Aprobado con 3 omisiones |

El total fue de 54 ejecuciones: 51 aprobadas y 3 comparaciones visuales omitidas en el proyecto móvil, porque las capturas de referencia se generaron para escritorio. Las omisiones están declaradas en el código y no representan fallos. Todas las pruebas que requieren backend se ejecutaron con `E2E_BACKEND=1`.

### 5.5 Accesibilidad

Se ejecutó Axe sobre las pantallas de login, registro, panel inicial, solicitudes, servicios, notificaciones, perfil, administración y error. Los resultados fueron los siguientes:

- Cero violaciones de las reglas WCAG 2.1 AA evaluadas por Axe.
- Contraste de texto y componentes conforme en las pantallas evaluadas.
- Navegación por teclado con foco visible.
- Etiquetas accesibles en formularios, botones, tablas y regiones.
- Mensajes de error asociados a los campos.
- Respeto de `prefers-reduced-motion` en las animaciones.
- Sin desbordamiento horizontal a 360, 768 y 1280 px.

La accesibilidad se verificó de forma automatizada. No se sustituye una auditoría manual con lectores de pantalla, que queda recomendada para una siguiente iteración.

### 5.6 Rendimiento

| Medida                         | Resultado                            |
| ------------------------------ | ------------------------------------ |
| Bundle inicial                 | 604.53 kB                            |
| Transferencia inicial estimada | 146.40 kB                            |
| Lazy loading                   | Activo por ruta                      |
| Fuentes                        | Autoalojadas en `public/fonts/`      |
| Iconos                         | Subconjunto de 133 nombres           |
| Imágenes autenticadas          | Descarga como blob                   |
| Caché de estáticos             | `expires 1y` para archivos con hash  |
| `index.html`                   | Sin caché                            |
| Compresión                     | gzip para texto, CSS, JS, JSON y SVG |

El build no realiza peticiones a Google Fonts. Las fuentes se precargan y se sirven desde el mismo origen, lo que reduce el tiempo de bloqueo y evita dependencias externas.

### 5.7 Prueba de humo del despliegue

La prueba de humo se ejecutó contra el despliegue local con Nginx en `http://127.0.0.1:8083`, con proxy `/api` hacia `http://127.0.0.1:8082`. La Tabla 10 presenta las comprobaciones.

| N.º | Comprobación                                        | Resultado |
| --: | --------------------------------------------------- | --------- |
|   1 | `GET /` devuelve 200                                | Correcto  |
|   2 | `GET /login` devuelve 200                           | Correcto  |
|   3 | Ruta inexistente devuelve la SPA                    | Correcto  |
|   4 | `index.html` contiene `<app-root>`                  | Correcto  |
|   5 | Fuente Roboto disponible                            | Correcto  |
|   6 | Fuente Material Symbols disponible                  | Correcto  |
|   7 | `GET /api/catalogos/distritos` devuelve 200         | Correcto  |
|   8 | La respuesta de catálogos es una lista con datos    | Correcto  |
|   9 | Cabecera `X-Content-Type-Options`                   | Correcto  |
|  10 | Cabecera `X-Frame-Options`                          | Correcto  |
|  11 | Cabecera `Referrer-Policy`                          | Correcto  |
|  12 | Cabecera `Content-Security-Policy`                  | Correcto  |
|  13 | Login administrativo devuelve `accessToken`         | Correcto  |
|  14 | `/api/auth/me` devuelve el perfil del administrador | Correcto  |

La prueba de humo se encuentra en `deploy/smoke-test.sh` y puede ejecutarse contra cualquier despliegue:

```bash
SMOKE_ADMIN_EMAIL=admin@fixtech.pe \
SMOKE_ADMIN_PASSWORD='Admin123!' \
./deploy/smoke-test.sh http://127.0.0.1:8083
```

### 5.8 Verificación en navegador

Se ejecutó una prueba adicional con Playwright contra el despliegue de Nginx. El flujo abrió `/login`, inició sesión con la cuenta administrativa, esperó la redirección a `/app/inicio` y verificó el saludo “Hola, Administrador”. También se comprobó que la fuente computada del cuerpo fuera Roboto y que no se registraran errores en la consola del navegador.

| Verificación                    | Resultado                          |
| ------------------------------- | ---------------------------------- |
| Título de la pantalla de acceso | “Iniciar sesión”                   |
| Saludo del panel administrativo | “Hola, Administrador”              |
| Fuente computada                | Roboto, Helvetica Neue, sans-serif |
| Errores de consola              | 0                                  |
| Redirección posterior al login  | Correcta                           |

## 6. Resultados del backend

### 6.1 Pruebas automatizadas

El backend se verificó con `./mvnw clean verify`. La Tabla 12 resume el resultado.

| Métrica                | Resultado       |
| ---------------------- | --------------- |
| Pruebas ejecutadas     | 337             |
| Fallos                 | 0               |
| Errores                | 0               |
| Pruebas omitidas       | 0               |
| Clases de prueba       | 40              |
| Tiempo total del build | 29.4 s          |
| Resultado              | `BUILD SUCCESS` |

Las pruebas cubren registro, login, refresco de token, bloqueo por intentos fallidos, autorización por rol y por propiedad, solicitudes, imágenes, ofertas, contraofertas, aceptación transaccional, ejecución del servicio, PIN, avances, constancias, ajustes de precio, comisiones, pagos, bloqueo por deuda, reseñas, reclamos, notificaciones, auditoría, parámetros, catálogos y reportes XLSX.

### 6.2 Cobertura

| Ámbito                        | Líneas cubiertas | Líneas totales | Cobertura de líneas | Cobertura de ramas |
| ----------------------------- | ---------------: | -------------: | ------------------: | -----------------: |
| Paquete `com.fixtech.service` |            2 805 |          2 984 |             94.00 % |            76.84 % |
| Proyecto completo             |            3 491 |          4 009 |             87.08 % |            70.97 % |

El umbral de JaCoCo exige al menos 70 % de cobertura de líneas en el paquete de servicios. El resultado de 94.00 % supera el umbral y se considera satisfactorio para el cierre.

### 6.3 Documentación OpenAPI

| Elemento                 | Resultado                      |
| ------------------------ | ------------------------------ |
| Título                   | FIXTECH API                    |
| Versión                  | 1.0.0                          |
| Rutas documentadas       | 84                             |
| Operaciones documentadas | 98                             |
| Esquema de seguridad     | `bearerAuth` (HTTP Bearer JWT) |
| Swagger en desarrollo    | Disponible                     |
| Swagger en producción    | Deshabilitado                  |
| Etiquetas de dominio     | 19, en español                 |

La documentación OpenAPI es la fuente de verdad para los contratos consumidos por la SPA. Durante el proyecto se contrastaron los campos y endpoints utilizados; las necesidades sin contrato se registraron en `BRECHAS_PENDIENTES.md` y no se implementaron pantallas que prometieran funcionalidad inexistente.

### 6.4 Prueba de carga

| Métrica               | Resultado                                   |
| --------------------- | ------------------------------------------- |
| Herramienta           | Apache JMeter 5.6.3                         |
| Usuarios concurrentes | 100                                         |
| Duración              | 60 s                                        |
| Peticiones            | 139 200                                     |
| Errores               | 0                                           |
| Percentil 95          | 103 ms                                      |
| Percentil 99          | 136 ms                                      |
| Endpoint              | Catálogo público con acceso a base de datos |

El resultado cumple el requerimiento no funcional de respuesta para la carga de referencia del proyecto.

### 6.5 Seguridad

| Métrica        | Resultado                          |
| -------------- | ---------------------------------- |
| Herramienta    | OWASP ZAP 2.16.1                   |
| Alertas altas  | 0                                  |
| Alertas medias | 0                                  |
| Alertas bajas  | 0                                  |
| Alcance        | API desplegada en el entorno local |

El baseline de ZAP no reportó hallazgos. Esto no sustituye una prueba de penetración profunda ni una revisión de infraestructura de producción, que se recomiendan antes de una puesta en producción real.

### 6.6 Copias de seguridad

Se verificó el respaldo de la base de datos y la restauración en un entorno controlado. Los scripts `backup.sh` y `restore.sh` del backend permiten generar y restaurar copias comprimidas. La evidencia se encuentra en el reporte de pruebas del backend.

## 7. Seguridad de la solución

### 7.1 Autenticación y sesión

La autenticación se basa en JWT emitidos por el backend. La SPA almacena el token de acceso y el token de refresco en `sessionStorage`. El interceptor agrega el encabezado `Authorization: Bearer` y, ante un 401, intenta renovar el token una sola vez antes de cerrar la sesión. Los guards validan la autenticación, el rol y, en el caso del técnico, la aprobación y el bloqueo por deuda.

`sessionStorage` es una decisión aceptada para el MVP. La sesión no se comparte entre pestañas, se pierde al cerrar la pestaña y los tokens son legibles por un ataque XSS. La alternativa recomendada para producción es usar cookies `HttpOnly`, `Secure` y `SameSite` con protección CSRF y mantener el token de acceso en memoria. Esta limitación se documenta en el README y en el plan del proyecto.

### 7.2 Cabeceras y política de contenido

El despliegue con Nginx agrega las siguientes cabeceras:

| Cabecera                  | Valor                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-Content-Type-Options`  | `nosniff`                                                                                                                                                                                                                               |
| `X-Frame-Options`         | `DENY`                                                                                                                                                                                                                                  |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                                                                                                                                                                                       |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()`                                                                                                                                                                                              |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'sha256-...'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'` |

Angular inserta un script inline para activar el CSS crítico. La política incluye su hash SHA-256 para permitir la ejecución sin recurrir a `unsafe-inline` en `script-src`. El hash debe recalcularse cuando cambie el build:

```bash
python3 deploy/calcular-csp-hash.py dist/fixtech-frontend/browser/index.html
```

### 7.3 CORS y mismo origen

En producción, la SPA y la API se publican bajo el mismo dominio. Nginx sirve los archivos estáticos y redirige `/api` al backend. Aun así, el backend debe incluir el origen público en `FIXTECH_CORS_ORIGINS`, porque el navegador envía el encabezado `Origin` en las peticiones `POST`, `PUT`, `PATCH` y `DELETE`. La configuración de Docker Compose incluye `http://localhost:8088` y `http://127.0.0.1:8088` como orígenes de ejemplo. En un VPS se debe reemplazar por el dominio real.

### 7.4 Gestión de secretos

- `.env` y `.env.*` están excluidos de Git.
- `application-dev.properties` está excluido de Git.
- Las credenciales de ejemplo usan valores explícitamente marcados como “CAMBIE”.
- El secreto JWT se genera con `openssl rand -hex 32`.
- Swagger se deshabilita en el perfil de producción.
- La prueba de humo no imprime tokens ni contraseñas.

### 7.5 Limitaciones aceptadas

| Limitación                                 | Impacto                                       | Decisión                                          |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------- |
| Token en `sessionStorage`                  | Legible por XSS; sesión por pestaña           | Aceptada para el MVP; documentar cookies HttpOnly |
| Sin recuperación de contraseña             | El usuario no puede restablecer su clave      | Brecha de API registrada                          |
| Sin cambio de contraseña                   | No hay acción en la SPA                       | Brecha de API registrada                          |
| Sin edición de perfil general              | Cliente y administrador no editan sus datos   | Brecha de API registrada                          |
| Mensajería sin tiempo real                 | La conversación se actualiza manualmente      | Aceptada; no se simula tiempo real                |
| Sin anulación de pagos                     | No hay endpoint para editar o anular pagos    | Brecha de API registrada                          |
| Sin desbloqueo manual de deuda             | El bloqueo se sincroniza con pagos y revisión | Brecha de API registrada                          |
| Sin búsqueda pública de técnicos           | El cliente solo ve técnicos en ofertas        | Brecha de API registrada                          |
| Sin borrado físico de catálogos            | Solo se activan o desactivan                  | Brecha de API registrada                          |
| Documentos de verificación sin controlador | El admin no puede revisar documentos          | Brecha de API registrada                          |

## 8. Despliegue

### 8.1 Despliegue con Nginx

Se preparó una configuración de Nginx para VPS en `deploy/nginx/fixtech.conf`. La configuración sirve la SPA desde `/var/www/fixtech`, aplica fallback a `index.html`, redirige `/api/` al backend en `127.0.0.1:8082`, comprime texto y aplica cabeceras de seguridad. La configuración se validó con `nginx -t` y se ejecutó en un puerto local para la prueba de humo.

El procedimiento completo se documenta en el Manual de despliegue. Los pasos esenciales son:

1. Compilar la SPA con `npm run build`.
2. Copiar `dist/fixtech-frontend/browser` a `/var/www/fixtech`.
3. Copiar la configuración a `/etc/nginx/sites-available/fixtech`.
4. Ajustar `server_name` y el upstream del backend.
5. Crear el enlace simbólico en `sites-enabled`.
6. Validar con `nginx -t` y recargar con `systemctl reload nginx`.
7. Configurar el origen público en `FIXTECH_CORS_ORIGINS`.
8. Ejecutar la prueba de humo.

### 8.2 Despliegue con Docker Compose

Se preparó una pila de Docker Compose con tres servicios:

| Servicio   | Imagen / construcción                 | Puerto            | Volumen        |
| ---------- | ------------------------------------- | ----------------- | -------------- |
| `mysql`    | `mysql:8.4`                           | Interno 3306      | `mysql_data`   |
| `backend`  | Contexto del repositorio backend      | Interno 8080      | `uploads_data` |
| `frontend` | `deploy/Dockerfile` (Node 22 + Nginx) | `${HTTP_PORT}:80` | —              |

La configuración se validó con `docker-compose -f deploy/docker-compose.yml --env-file deploy/.env.example config`. La validación sintáctica y de interpolación fue correcta. La imagen no se construyó en el entorno de desarrollo porque el daemon de Docker no era accesible sin permisos; esta situación se registra como observación y no como fallo de la configuración.

### 8.3 Prueba de humo

La prueba de humo verificó la SPA, el fallback, las fuentes, el proxy `/api`, las cabeceras de seguridad y el login administrativo. Las 14 comprobaciones fueron correctas. El script está diseñado para ejecutarse contra cualquier URL base y admite credenciales por variables de entorno.

### 8.4 Reversión

El despliegue con Nginx permite revertir conservando la versión anterior de `dist` y la configuración previa. El procedimiento recomendado es:

1. Guardar una copia de `/var/www/fixtech` antes de cada despliegue.
2. Guardar una copia de `/etc/nginx/sites-available/fixtech`.
3. Si la nueva versión falla, restaurar la carpeta y la configuración anteriores.
4. Ejecutar `nginx -t` y `systemctl reload nginx`.
5. Verificar con la prueba de humo.

En Docker Compose, la reversión se realiza con la imagen o el tag anterior y `docker-compose up -d`.

## 9. Incidencias y riesgos

| ID   | Descripción                                                                  | Severidad   | Estado        | Mitigación                                                                           |
| ---- | ---------------------------------------------------------------------------- | ----------- | ------------- | ------------------------------------------------------------------------------------ |
| R-01 | El daemon de Docker no es accesible sin permisos en el entorno de desarrollo | Media       | Abierto       | Ejecutar con un usuario autorizado o validar la pila en un host con Docker operativo |
| R-02 | Token JWT en `sessionStorage`                                                | Media       | Aceptado      | Documentar cookies HttpOnly para producción                                          |
| R-03 | Brechas de API sin endpoint                                                  | Media       | Documentado   | Registrar en `BRECHAS_PENDIENTES.md`; no prometer funcionalidad                      |
| R-04 | Datos E2E sin limpieza automática                                            | Baja        | Aceptado      | Usar correos únicos; base de pruebas dedicada                                        |
| R-05 | CORS mal configurado en producción                                           | Media       | Mitigado      | Incluir el origen público en `FIXTECH_CORS_ORIGINS`                                  |
| R-06 | Cambio del hash CSP con cada build                                           | Baja        | Mitigado      | Recalcular con `deploy/calcular-csp-hash.py`                                         |
| R-07 | Swagger deshabilitado en producción                                          | Informativa | Aceptado      | Habilitar solo en desarrollo                                                         |
| R-08 | Sin monitoreo de disponibilidad                                              | Baja        | Recomendación | Configurar monitoreo externo y alertas                                               |
| R-09 | Sin pruebas de usabilidad con usuarios                                       | Baja        | Recomendación | Planificar sesiones con clientes y técnicos                                          |
| R-10 | Sin prueba de penetración profunda                                           | Media       | Recomendación | Contratar o ejecutar una revisión antes de producción                                |

## 10. Brechas de API

Las brechas detectadas durante el proyecto se mantienen registradas en `BRECHAS_PENDIENTES.md`. La Tabla 19 resume las principales.

| N.º | Brecha                                               | Impacto                                          | Decisión                                     |
| --: | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
|   1 | Documentos de verificación sin controlador           | El admin no puede revisar documentos del técnico | No se muestra la sección                     |
|   2 | Cambio y recuperación de contraseña sin endpoints    | No hay recuperación ni cambio desde la SPA       | No se muestran enlaces                       |
|   3 | Búsqueda y perfil público de técnicos sin endpoint   | El cliente no puede buscar técnicos              | Se pospone                                   |
|   4 | Fotos no reemplazables al editar solicitud           | Solo se adjuntan al crear                        | Se advierte en la interfaz                   |
|   5 | Edición del perfil general sin endpoint              | Cliente y admin no editan sus datos              | Solo el técnico edita su perfil profesional  |
|   6 | Datos E2E sin limpieza                               | Se acumulan cuentas y registros                  | Correos únicos y base de pruebas             |
|   7 | `OfertaResponse` sin resumen de solicitud            | “Mis ofertas” muestra datos limitados            | Se consulta el detalle mientras esté vigente |
|   8 | Detalle de solicitud disponible solo si está vigente | Una oferta histórica no abre el detalle          | Se documenta la limitación                   |
|   9 | Sin endpoint “mi oferta de una solicitud”            | Se filtra el listado de ofertas                  | Aceptable para el volumen del MVP            |
|  10 | `SolicitudDisponibleResponse` sin imagen principal   | Se usa la primera imagen                         | Marcador si no hay imágenes                  |
|  11 | Aprobación y deuda no se validan en el listado       | El frontend aplica el guard                      | Se ocultan rutas si no puede ofertar         |
|  12 | Mensajería sin tiempo real                           | Actualización manual                             | Se informa en la interfaz                    |
|  13 | Pagos sin anulación ni desbloqueo manual             | No hay acciones administrativas                  | Se explica en la interfaz                    |
|  14 | Catálogos sin borrado físico                         | Solo activar o desactivar                        | No se ofrece eliminación                     |

## 11. Conclusiones

1. El frontend de FIXTECH cumple los criterios de compilación, pruebas unitarias, pruebas E2E, accesibilidad, lint y formato definidos para el cierre.
2. El build de producción se mantiene dentro de los presupuestos de rendimiento y utiliza carga diferida, fuentes autoalojadas y caché de estáticos.
3. La prueba de humo contra Nginx confirma que la SPA, los recursos, el proxy `/api`, las cabeceras de seguridad y el login funcionan en un despliegue real.
4. El backend cumple los criterios de pruebas, cobertura, documentación OpenAPI, carga y seguridad establecidos en el proyecto.
5. Las brechas de API están documentadas y no se implementaron pantallas que prometieran funcionalidad inexistente.
6. La solución está apta para la aceptación funcional y técnica del alcance comprometido, con observaciones que no bloquean la entrega.
7. La construcción de la imagen Docker queda pendiente de un entorno con permisos sobre el daemon; la configuración fue validada sintácticamente.
8. La firma del acta de conformidad queda pendiente de los involucrados.

## 12. Recomendaciones

1. Ejecutar la pila de Docker Compose en un host con Docker operativo y completar la prueba de humo contra el puerto público.
2. Reemplazar `sessionStorage` por cookies `HttpOnly`, `Secure` y `SameSite` con protección CSRF antes de una producción con datos reales.
3. Configurar HTTPS con un certificado válido y redirigir todo el tráfico HTTP a HTTPS.
4. Incluir el dominio público en `FIXTECH_CORS_ORIGINS` y verificar el login desde el navegador.
5. Automatizar el recálculo del hash CSP como parte del pipeline de despliegue.
6. Configurar monitoreo de disponibilidad, alertas y retención de logs.
7. Programar copias de seguridad diarias y probar la restauración periódicamente.
8. Planificar una auditoría de accesibilidad manual con lectores de pantalla.
9. Ejecutar una prueba de penetración antes de exponer la aplicación a Internet.
10. Resolver las brechas de API en una siguiente iteración, priorizando recuperación de contraseña, perfil general y documentos de verificación.

## 13. Anexos

### 13.1 Comandos de reproducción

```bash
# Frontend
npm ci
npm run format:check
npm run lint
npm test
npm run build

# E2E con backend local
E2E_BACKEND=1 npx playwright test

# Datos semilla
npm run e2e:seed

# Prueba de humo
SMOKE_ADMIN_EMAIL=admin@fixtech.pe \
SMOKE_ADMIN_PASSWORD='Admin123!' \
./deploy/smoke-test.sh http://127.0.0.1:8083

# Backend
cd /home/juan/IdeaProjects/CalidadSoftware
./mvnw clean verify
```

### 13.2 Evidencias

| Evidencia                      | Ubicación                         |
| ------------------------------ | --------------------------------- |
| Plan y checklist de fases      | `PLAN_FRONTEND.md`                |
| Brechas de API                 | `BRECHAS_PENDIENTES.md`           |
| Configuración de Nginx         | `deploy/nginx/fixtech.conf`       |
| Configuración de Docker        | `deploy/docker-compose.yml`       |
| Prueba de humo                 | `deploy/smoke-test.sh`            |
| Cálculo del hash CSP           | `deploy/calcular-csp-hash.py`     |
| Datos semilla E2E              | `e2e/seed/seed-e2e.mjs`           |
| Diagramas                      | `docs/word/assets/`               |
| Reporte de pruebas del backend | `docs/calidad/REPORTE_PRUEBAS.md` |
| Documentos Word                | `/home/juan/Documentos/calidadd/` |

### 13.3 Glosario

| Término      | Definición                                              |
| ------------ | ------------------------------------------------------- |
| SPA          | Aplicación de una sola página ejecutada en el navegador |
| JWT          | Token firmado utilizado para autenticar las peticiones  |
| CORS         | Mecanismo que controla el acceso entre orígenes         |
| CSP          | Política de seguridad de contenido del navegador        |
| Axe          | Herramienta automatizada de accesibilidad               |
| E2E          | Prueba de extremo a extremo                             |
| p95          | Percentil 95 de tiempo de respuesta                     |
| Lazy loading | Carga diferida de módulos                               |
| Smoke test   | Prueba rápida de humo sobre un despliegue               |
| OpenAPI      | Especificación de la API REST                           |
