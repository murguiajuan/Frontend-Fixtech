---
titulo: Acta de conformidad
subtitulo: FIXTECH — Plataforma web de soporte y mantenimiento tecnológico
tipo: Acta de conformidad
codigo: FIXTECH-ACT-001
version: 1.0
fecha: Octubre de 2026
autor: Juan Jesús Murguía Rivera
curso: Calidad de Software
---

## 1. Datos generales

| Elemento                 | Detalle                                                         |
| ------------------------ | --------------------------------------------------------------- |
| Acta N.°                 | 001-2026-FIXTECH                                                |
| Proyecto                 | FIXTECH — Plataforma web de soporte y mantenimiento tecnológico |
| Tipo de acta             | Conformidad de cierre de proyecto                               |
| Fecha                    | 27 de octubre de 2026                                           |
| Lugar                    | Piura, Perú                                                     |
| Versión evaluada         | 1.0                                                             |
| Responsable del proyecto | Juan Jesús Murguía Rivera                                       |
| Curso                    | Calidad de Software                                             |
| Repositorio frontend     | `fixtech-frontend`                                              |
| Repositorio backend      | `CalidadSoftware`                                               |

## 2. Antecedentes

FIXTECH se desarrolló como una plataforma web para conectar a clientes de Piura con técnicos verificados para servicios de soporte y mantenimiento tecnológico. El proyecto se ejecutó por fases incrementales, desde la base técnica hasta el cierre de calidad y despliegue. Cada fase se cerró con build, pruebas, lint, formato y verificación de accesibilidad.

La Fase 12 tuvo como objetivo ejecutar la verificación final, preparar la documentación de despliegue, elaborar el checklist de aceptación por rol y suscribir la presente acta de conformidad. La verificación se realizó sobre la versión de cierre de los repositorios frontend y backend.

## 3. Alcance verificado

La conformidad cubre los siguientes componentes y procesos:

- SPA Angular 22 con autenticación, layouts por rol y módulos de cliente, técnico y administrador.
- API REST Spring Boot 4.1.1 con autenticación JWT, autorización por rol y propiedad, y persistencia en MySQL 8.
- Flujo completo de solicitud, oferta, negociación, aceptación, ejecución, constancias, conformidad, reseña, reclamo, comisión y pago.
- Panel administrativo de técnicos, usuarios, reseñas, reclamos, pagos, catálogos, parámetros, reportes y auditoría.
- Notificaciones, perfil de cuenta y cierre de sesión por expiración.
- Despliegue con Nginx y proxy `/api`.
- Configuración de Docker Compose para frontend, backend y MySQL.
- Documentación técnica, manual de despliegue, manual de usuario, informe de QA y checklist de aceptación.

### 3.1 Fuera del alcance

- Funcionalidades que dependen de endpoints no disponibles en el backend.
- Pruebas de penetración profunda y auditoría de infraestructura.
- Monitoreo de disponibilidad en un entorno cloud real.
- Pruebas de usabilidad con usuarios externos.
- Migración de datos históricos.

## 4. Documentos de referencia

| Documento                                    | Código          | Versión |
| -------------------------------------------- | --------------- | ------- |
| Informe final de aseguramiento de la calidad | FIXTECH-QA-001  | 1.0     |
| Manual de despliegue                         | FIXTECH-DEP-001 | 1.0     |
| Documentación técnica de la solución         | FIXTECH-TEC-001 | 1.0     |
| Manual de usuario                            | FIXTECH-USR-001 | 1.0     |
| Checklist de aceptación por rol              | FIXTECH-CHK-001 | 1.0     |
| Plan de trabajo del frontend                 | —               | 1.0     |
| Registro de brechas pendientes               | —               | 1.0     |
| Reporte de pruebas del backend               | —               | 1.0     |

## 5. Resultados de la verificación

| Verificación                          | Resultado                                       | Estado                 |
| ------------------------------------- | ----------------------------------------------- | ---------------------- |
| Build de producción del frontend      | 604.53 kB iniciales; 146.40 kB de transferencia | Cumple                 |
| Pruebas unitarias del frontend        | 501 pruebas; 0 fallos                           | Cumple                 |
| Pruebas E2E del frontend              | 54 ejecuciones; 51 aprobadas; 3 omitidas        | Cumple con observación |
| Accesibilidad con Axe                 | 0 violaciones                                   | Cumple                 |
| ESLint y Prettier                     | Sin errores                                     | Cumple                 |
| Prueba de humo con Nginx              | 14 comprobaciones correctas                     | Cumple                 |
| Login administrativo en el despliegue | Correcto; 0 errores de consola                  | Cumple                 |
| Pruebas automatizadas del backend     | 337 pruebas; 0 fallos                           | Cumple                 |
| Cobertura del backend                 | 94.00 % servicios; 87.08 % global               | Cumple                 |
| Documentación OpenAPI                 | 84 rutas; 98 operaciones                        | Cumple                 |
| Carga con JMeter                      | p95 103 ms; 0 errores                           | Cumple                 |
| Seguridad con OWASP ZAP               | 0 altas, 0 medias, 0 bajas                      | Cumple                 |
| Configuración de Docker Compose       | Válida                                          | Cumple                 |
| Construcción de la imagen Docker      | No ejecutada por permisos del daemon            | Observado              |
| Checklist de aceptación               | 111 cumple; 6 no aplica; 2 no cumple            | Cumple con observación |

## 6. Acuerdos

Las partes acuerdan lo siguiente:

1. **Aceptar** la versión 1.0 de FIXTECH para el alcance funcional y técnico comprometido, con las observaciones registradas en la presente acta.
2. **Reconocer** que el frontend y el backend cumplen los criterios de build, pruebas, cobertura, accesibilidad, lint, formato y seguridad definidos para el cierre.
3. **Reconocer** que el despliegue con Nginx fue verificado de extremo a extremo, incluyendo la SPA, los recursos estáticos, el proxy `/api`, las cabeceras de seguridad y el login administrativo.
4. **Registrar** que la construcción y ejecución de la imagen Docker no se realizó en el entorno de desarrollo por permisos del daemon, y que la configuración fue validada con `docker-compose config`.
5. **Registrar** que las funcionalidades sin endpoint en el backend se documentaron como brechas y no se implementaron pantallas que prometieran funcionalidad inexistente.
6. **Recomendar** completar la pila Docker en un host operativo, migrar la sesión a cookies `HttpOnly` y ejecutar una prueba de penetración antes de una puesta en producción con datos reales.
7. **Adjuntar** el checklist de aceptación, el informe de QA y los manuales como evidencia de la conformidad.

## 7. Observaciones y recomendaciones

### 7.1 Observaciones

- Las 3 comparaciones visuales omitidas en el proyecto móvil corresponden a capturas de referencia generadas para escritorio y no representan fallos funcionales.
- La imagen Docker no se construyó por permisos del daemon en el entorno de desarrollo.
- La recuperación y el cambio de contraseña, la edición del perfil general, la anulación de pagos, el desbloqueo manual de deuda, los documentos de verificación y el borrado físico de catálogos no están disponibles en el backend.
- La sesión se almacena en `sessionStorage`, lo que limita la sesión a una pestaña y expone los tokens ante XSS.
- La accesibilidad se verificó con Axe; no se realizó una auditoría manual con lectores de pantalla.

### 7.2 Recomendaciones

1. Ejecutar la pila Docker en un host con Docker operativo y completar la prueba de humo.
2. Configurar HTTPS con un certificado válido y HSTS.
3. Incluir el dominio público en `FIXTECH_CORS_ORIGINS`.
4. Automatizar el recálculo del hash CSP en el pipeline.
5. Migrar la sesión a cookies `HttpOnly`, `Secure` y `SameSite` con CSRF.
6. Configurar monitoreo, alertas y retención de logs.
7. Programar copias de seguridad diarias y probar la restauración.
8. Ejecutar una auditoría de accesibilidad manual.
9. Ejecutar una prueba de penetración antes de producción.
10. Resolver las brechas de API en una siguiente iteración.

## 8. Conformidad

Con base en los resultados presentados, las partes declaran su conformidad con la versión 1.0 de FIXTECH en el alcance descrito, sin perjuicio de las observaciones y recomendaciones registradas. La conformidad no implica la aceptación de funcionalidades fuera del alcance ni de las brechas de API documentadas.

La presente acta se firma en señal de aceptación en la ciudad de Piura, a los veintisiete días del mes de octubre de dos mil veintiséis.

## 9. Firmas

| Rol                       | Nombre                    | Documento | Firma |
| ------------------------- | ------------------------- | --------- | ----- |
| Responsable del proyecto  | Juan Jesús Murguía Rivera |           |       |
| Representante del cliente |                           |           |       |
| Responsable de calidad    |                           |           |       |
| Administrador del sistema |                           |           |       |
| Docente del curso         |                           |           |       |

## 10. Anexos

| Anexo | Documento                                    |
| ----- | -------------------------------------------- |
| A     | Informe final de aseguramiento de la calidad |
| B     | Manual de despliegue                         |
| C     | Documentación técnica de la solución         |
| D     | Manual de usuario                            |
| E     | Checklist de aceptación por rol              |
| F     | Evidencia de pruebas y despliegue            |

La evidencia digital se encuentra en los repositorios del proyecto y en la carpeta de documentos de cierre. Los documentos Word se entregan en `/home/juan/Documentos/calidadd/`.
