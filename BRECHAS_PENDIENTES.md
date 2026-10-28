# Brechas pendientes — Frontend FIXTECH

Registro de limitaciones y contratos faltantes detectados durante las fases. **No se implementan
pantallas que prometan estas funciones hasta que el backend exponga los endpoints o campos
correspondientes.** Se resolverán al final del proyecto, salvo que el alcance de una fase indique lo
contrario.

| #   | Brecha                                                        | Impacto actual                                                                                                                          | Decisión provisional                                                                                                            |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Documentos de verificación del técnico sin controlador        | La tabla `documento_tecnico` existe, pero no hay endpoints para cargarlos, listarlos ni revisarlos. El panel admin no puede mostrarlos. | El detalle administrativo y el perfil indican que no hay documentos disponibles; no se inventan campos.                         |
| 2   | Cambio y recuperación de contraseña sin endpoints             | No hay forma de recuperar la cuenta ni cambiar la contraseña desde la SPA.                                                              | No se muestran enlaces “Olvidé mi contraseña” ni acciones de cambio.                                                            |
| 3   | Búsqueda y perfil público de técnicos sin endpoint            | El cliente solo ve al técnico dentro de las ofertas recibidas; no puede buscar técnicos por especialidad o distrito.                    | Se pospone hasta que exista un contrato público.                                                                                |
| 4   | Fotos no reemplazables en `PUT /api/solicitudes/{id}`         | La edición de una solicitud solo actualiza datos; no permite agregar ni quitar fotos.                                                   | Las fotos se adjuntan únicamente al crear. La interfaz lo advierte y no simula la edición de archivos.                          |
| 5   | Edición del perfil de usuario general sin endpoint            | El cliente y el administrador no pueden actualizar nombres, apellidos, celular, DNI ni foto de cuenta.                                  | Solo el perfil profesional del técnico es editable (`PUT /api/perfil/tecnico` y `POST /api/perfil/foto`).                       |
| 6   | Datos de prueba E2E sin seed ni limpieza                      | Los E2E con backend crean clientes, técnicos, solicitudes y ofertas reales; no existe un endpoint para eliminarlos.                     | Cada prueba usa correos y datos únicos; la limpieza queda para la Fase 12.                                                      |
| 7   | `OfertaResponse` no incluye el resumen de la solicitud        | “Mis ofertas” solo recibe `solicitudId`; no puede mostrar equipo, servicio, distrito ni vencimiento desde la oferta.                    | Se muestran los datos propios de la oferta y el identificador; el detalle de la solicitud se consulta mientras siga disponible. |
| 8   | Detalle de solicitud disponible solo mientras está vigente    | `GET /api/solicitudes/disponibles/{id}` responde `403` cuando la solicitud deja de ser compatible, vence, se cancela o se acepta.       | Una oferta histórica no puede abrir el detalle original. Se documenta como limitación y no se inventa un endpoint.              |
| 9   | Sin endpoint “mi oferta de una solicitud”                     | Para saber si el técnico ya ofertó se debe consultar `GET /api/ofertas/mias` y filtrar por `solicitudId`.                               | Se usa ese listado como fuente de verdad; es aceptable para el volumen del MVP.                                                 |
| 10  | `SolicitudDisponibleResponse` no trae `imagenPrincipalUrl`    | El listado de solicitudes disponibles no tiene un campo directo para la miniatura.                                                      | Se usa la primera imagen de `imagenes`; si no hay, se muestra un marcador.                                                      |
| 11  | Aprobación y deuda no se validan en el listado de disponibles | `GET /api/solicitudes/disponibles` no valida aprobación ni bloqueo por deuda; `POST` de oferta sí.                                      | El frontend aplica `tecnicoAprobadoGuard` y oculta las rutas si el técnico no puede ofertar.                                    |
| 12  | Sin endpoints de notificaciones en la SPA                     | El backend genera notificaciones, pero el centro de notificaciones pertenece a la Fase 10.                                              | No se muestran badges ni bandejas de notificaciones todavía.                                                                    |
| 13  | Mensajería sin actualización en tiempo real                   | No hay WebSocket ni SSE para mensajes; la conversación solo se actualiza al abrir el detalle o pulsar “Actualizar”.                     | Se mantiene la actualización manual y se informa en la interfaz; no se simula tiempo real.                                      |

## Brechas cerradas

- Edición del perfil profesional del técnico y foto autorizada: `PUT /api/perfil/tecnico`,
  `POST /api/perfil/foto` y `GET /api/tecnicos/{id}/foto` (Fase 4).
- Listado administrativo de técnicos con `id` y `usuarioId` (Fase 2).
- Constancias de taller: registro multipart con 1 a 5 fotos, foto autenticada, confirmación del
  cliente y bloqueo de la finalización hasta la constancia de entrega (Fase 7).
- Reseñas y reclamos: alta, consulta, respuesta del técnico, reporte y moderación de reseñas,
  resolución y seguimiento administrativo de reclamos con fotos autenticadas (Fase 7).

## Regla de trabajo

Antes de crear una pantalla o un campo nuevo, verificar Swagger/OpenAPI y el código del backend. Si
el contrato no existe, agregar la brecha a este documento y continuar con una alternativa que no
prometa funcionalidad inexistente.
