---
titulo: Manual de usuario
subtitulo: FIXTECH — Plataforma web de soporte y mantenimiento tecnológico
tipo: Manual de usuario
codigo: FIXTECH-USR-001
version: 1.0
fecha: Octubre de 2026
autor: Juan Jesús Murguía Rivera
curso: Calidad de Software
---

## 1. Introducción

Este manual explica cómo usar FIXTECH desde un navegador web. Está dirigido a clientes, técnicos y administradores. Describe el acceso, el registro, las acciones principales de cada rol, las notificaciones y las preguntas frecuentes.

FIXTECH permite publicar solicitudes de soporte técnico, recibir ofertas de técnicos verificados, aceptar una oferta, seguir la ejecución del servicio, dar conformidad, dejar una reseña y registrar un reclamo si fuera necesario. Los técnicos pueden ofertar, ejecutar servicios, registrar avances y constancias, y gestionar sus comisiones. Los administradores verifican técnicos, moderan reseñas, atienden reclamos, validan pagos y consultan reportes.

## 2. Requisitos y acceso

### 2.1 Requisitos

- Un navegador actualizado: Chrome, Edge, Firefox o Safari.
- Conexión a Internet.
- Una cuenta registrada como cliente, técnico o administrador.
- Para el registro de técnico: DNI, celular, especialidades y distritos de cobertura.

### 2.2 Dirección de acceso

La dirección de la aplicación la proporciona el administrador del sistema. En el entorno local de desarrollo es:

```text
http://localhost:4200
```

En producción se accede mediante el dominio configurado, por ejemplo:

```text
https://fixtech.example.com
```

### 2.3 Roles

| Rol           | Descripción                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Cliente       | Publica solicitudes, compara ofertas, acepta servicios, da conformidad, reseña y reclama                 |
| Técnico       | Ofrece servicios, ejecuta trabajos, registra avances y constancias, gestiona comisiones                  |
| Administrador | Verifica técnicos, gestiona usuarios, modera reseñas, atiende reclamos, valida pagos y consulta reportes |

## 3. Ingreso a la aplicación

1. Abra la dirección de FIXTECH en el navegador.
2. Ingrese su correo electrónico y contraseña.
3. Pulse **Ingresar**.
4. Si las credenciales son correctas, la aplicación lo lleva a **Inicio** según su rol.

| Campo              | Descripción                                                       |
| ------------------ | ----------------------------------------------------------------- |
| Correo electrónico | Correo registrado en la cuenta                                    |
| Contraseña         | Clave de acceso; puede mostrarse u ocultarse con el icono del ojo |

Si olvidó su contraseña, la aplicación no ofrece recuperación automática porque el backend aún no expone ese servicio. Contacte al administrador del sistema para recibir orientación.

### 3.1 Cierre de sesión

1. Abra el menú de usuario en la esquina superior derecha.
2. Seleccione **Cerrar sesión**.
3. La aplicación limpia la sesión y vuelve al inicio de sesión.

La sesión también se cierra cuando el token expira y no puede renovarse. En ese caso, la aplicación muestra un aviso y redirige al inicio de sesión.

## 4. Registro de cliente

1. En la pantalla de inicio de sesión, pulse **Crear cuenta**.
2. Complete el formulario **Registro de cliente**.
3. Acepte los términos y condiciones.
4. Pulse **Crear cuenta**.
5. Inicie sesión con el correo y la contraseña registrados.

| Campo                | Obligatorio | Descripción                      |
| -------------------- | ----------- | -------------------------------- |
| Nombres              | Sí          | Nombres del cliente              |
| Apellidos            | Sí          | Apellidos del cliente            |
| Correo electrónico   | Sí          | Correo único de acceso           |
| Celular              | Sí          | Número de contacto de 9 dígitos  |
| DNI                  | Sí          | Documento de 8 dígitos           |
| Contraseña           | Sí          | Mínimo 8 caracteres              |
| Confirmar contraseña | Sí          | Debe coincidir con la contraseña |
| Aceptar términos     | Sí          | Condición para crear la cuenta   |

## 5. Registro de técnico

1. En la pantalla de inicio de sesión, pulse **Crear cuenta de técnico**.
2. Complete los datos personales y profesionales.
3. Seleccione al menos una especialidad y un distrito de cobertura.
4. Indique si ofrece atención a domicilio, en taller o ambas.
5. Acepte los términos y condiciones.
6. Pulse **Crear cuenta de técnico**.
7. Espere la verificación del administrador.

| Sección            | Campos principales                                   |
| ------------------ | ---------------------------------------------------- |
| Datos personales   | Nombres, apellidos, correo, celular, DNI, contraseña |
| Perfil profesional | Descripción, años de experiencia, especialidades     |
| Cobertura          | Distritos, modalidades de atención                   |
| Taller             | Dirección, referencia y horario, si ofrece taller    |
| Términos           | Aceptación obligatoria                               |

El técnico recién registrado queda en estado **PENDIENTE**. Mientras no sea aprobado, no puede acceder a solicitudes disponibles ni enviar ofertas. Si el administrador lo observa o rechaza, el estado se muestra en **Mi perfil**.

## 6. Uso para clientes

### 6.1 Panel de inicio

Al ingresar, el cliente ve un saludo personalizado, el resumen de su actividad y accesos rápidos a **Mis solicitudes** y **Mis servicios**. El menú lateral contiene **Inicio**, **Notificaciones**, **Mi cuenta**, **Mis solicitudes** y **Mis servicios**.

### 6.2 Crear una solicitud

1. Vaya a **Mis solicitudes**.
2. Pulse **Nueva solicitud**.
3. Complete los datos del equipo y del servicio.
4. Adjunte una o más fotos del equipo, si es necesario.
5. Revise la información y pulse **Publicar solicitud**.

| Campo                    | Obligatorio | Descripción                       |
| ------------------------ | ----------- | --------------------------------- |
| Tipo de equipo           | Sí          | Categoría del equipo a reparar    |
| Tipo de servicio         | Sí          | Servicio requerido                |
| Marca                    | No          | Marca del equipo                  |
| Modelo                   | No          | Modelo del equipo                 |
| Descripción del problema | Sí          | Detalle de la falla o necesidad   |
| Modalidad de atención    | Sí          | Domicilio o taller                |
| Distrito                 | Sí          | Distrito del servicio             |
| Dirección                | Sí          | Dirección de atención             |
| Referencia               | No          | Referencia para ubicar el lugar   |
| Urgencia                 | Sí          | Nivel de urgencia                 |
| Fecha preferida          | No          | Fecha deseada                     |
| Horario preferido        | No          | Horario deseado                   |
| Presupuesto referencial  | No          | Monto de referencia               |
| Fotos                    | No          | Imágenes del equipo o de la falla |

La solicitud queda en estado **PUBLICADA**. Cuando recibe ofertas, cambia a **CON_OFERTAS**.

### 6.3 Editar o cancelar una solicitud

1. Abra **Mis solicitudes**.
2. Localice la solicitud y pulse **Ver detalle**.
3. Para modificar datos, pulse **Editar** y guarde los cambios.
4. Para cancelar, pulse **Cancelar solicitud**, indique el motivo si lo desea y confirme.

Las fotos solo se adjuntan al crear la solicitud. La edición no reemplaza ni elimina fotos porque el backend no expone esa operación. La interfaz lo advierte.

### 6.4 Revisar ofertas

1. Abra el detalle de una solicitud con ofertas.
2. Revise la sección **Ofertas recibidas**.
3. Compare precio, plazo, modalidad, garantía y comentario.
4. Puede abrir **Comparar ofertas** para verlas en paralelo.

### 6.5 Aceptar una oferta

1. En **Ofertas recibidas**, elija la oferta.
2. Pulse **Aceptar oferta**.
3. Confirme la acción.
4. La aplicación crea el servicio y rechaza las demás ofertas.

Si la oferta recibida no le convence, puede solicitar una contraoferta. El técnico puede aceptarla, rechazarla o responder con una nueva propuesta.

### 6.6 Seguir el servicio

1. Vaya a **Mis servicios**.
2. Abra el servicio.
3. Revise el estado, el historial, los avances y las constancias.
4. Use **Mensajes** para comunicarse con el técnico.
5. Si el técnico propone un ajuste de precio, revise la justificación y pulse **Aprobar ajuste** o rechace la propuesta.

### 6.7 Confirmar la constancia de entrega

En la modalidad de taller, el técnico registra una constancia de recepción y otra de entrega. El cliente debe confirmar la constancia de entrega para habilitar la finalización. Revise las fotos y los datos antes de pulsar **Confirmar constancia**.

### 6.8 Dar conformidad

1. Cuando el servicio esté finalizado, abra el detalle.
2. Revise el trabajo realizado y los montos.
3. Pulse **Confirmar conformidad**.
4. La aplicación registra la conformidad y habilita la reseña.

Si el cliente no da conformidad, el sistema aplica la conformidad automática configurada por el administrador.

### 6.9 Dejar una reseña

1. Abra el servicio confirmado.
2. Pulse **Publicar reseña**.
3. Califique puntualidad, calidad y trato.
4. Escriba un comentario, si lo desea.
5. Envíe la reseña.

La reseña puede ser moderada por el administrador si incumple las normas de convivencia.

### 6.10 Registrar un reclamo

1. Abra el servicio.
2. Pulse **Registrar reclamo**.
3. Describa el problema y adjunte fotos si corresponde.
4. Envíe el reclamo.

El reclamo queda **ABIERTO**. El técnico puede responder y el administrador puede cambiar el estado a **EN_REVISION**, **RESUELTO** o **CERRADO**. El cliente puede consultar el detalle y el historial.

### 6.11 Notificaciones y cuenta

- **Notificaciones:** muestra la bandeja, el filtro de no leídas y la opción **Marcar todas como leídas**.
- **Mi cuenta:** muestra los datos de la cuenta en modo de solo lectura. La edición del perfil general no está disponible porque el backend no expone ese endpoint.

## 7. Uso para técnicos

### 7.1 Panel de inicio

El panel del técnico muestra el saludo, el estado de verificación, el saldo, la deuda y las modalidades de atención. El menú lateral contiene **Inicio**, **Notificaciones**, **Mi cuenta**, **Mi perfil**, **Solicitudes disponibles**, **Mis ofertas**, **Mis servicios** y **Comisiones**.

Si el técnico no está aprobado o tiene deuda pendiente, las opciones de solicitudes y ofertas aparecen deshabilitadas y la aplicación explica el motivo.

### 7.2 Completar el perfil profesional

1. Vaya a **Mi perfil**.
2. Revise los datos personales y profesionales.
3. Pulse **Editar perfil**.
4. Actualice descripción, experiencia, especialidades, distritos, modalidades y datos del taller.
5. Guarde los cambios.
6. Para cambiar la foto, pulse **Cambiar foto** y seleccione una imagen.

El perfil profesional es el único perfil editable en la SPA. Los datos generales de la cuenta se muestran en **Mi cuenta** en modo de solo lectura.

### 7.3 Consultar solicitudes disponibles

1. Vaya a **Solicitudes disponibles**.
2. Use los filtros por especialidad, distrito, modalidad o búsqueda.
3. Abra una solicitud para ver el detalle, las fotos y los requisitos.
4. Si la solicitud es compatible, pulse **Enviar oferta**.

### 7.4 Enviar una oferta

1. En el detalle de la solicitud, pulse **Enviar oferta**.
2. Complete precio, tiempo estimado, modalidad, garantía y comentario.
3. Revise la comisión estimada.
4. Pulse **Enviar oferta**.

La oferta queda en estado **ENVIADA**. El técnico puede editarla o retirarla mientras la solicitud siga vigente.

### 7.5 Gestionar ofertas y negociación

1. Vaya a **Mis ofertas**.
2. Revise el estado de cada oferta.
3. Si el cliente solicita una contraoferta, abra la negociación.
4. Puede aceptar la contraoferta, rechazarla o enviar una nueva propuesta.
5. Use **Historial de negociación** para revisar las acciones.

### 7.6 Ejecutar un servicio

1. Vaya a **Mis servicios**.
2. Abra el servicio aceptado.
3. Pulse **Validar PIN e iniciar** e ingrese el PIN proporcionado por el cliente.
4. Avance por los estados disponibles: traslado, diagnóstico, reparación, listo para recoger, etc.
5. Registre avances con descripción y fotos.
6. Use **Mensajes** para comunicarse con el cliente.
7. Si corresponde, proponga un ajuste de precio con su justificación.

### 7.7 Registrar constancias

En la modalidad de taller:

1. Abra el servicio.
2. En **Constancias del servicio**, pulse **Registrar constancia de recepción**.
3. Adjunte las fotos y los accesorios entregados.
4. Guarde la constancia.
5. Al finalizar el trabajo, pulse **Registrar constancia de entrega**.
6. Espere la confirmación del cliente.

La finalización del servicio se bloquea hasta que la constancia de entrega esté confirmada.

### 7.8 Finalizar el servicio

1. Revise que el trabajo esté completo y que las constancias estén confirmadas.
2. Pulse **Finalizar servicio**.
3. Confirme la acción.
4. El cliente podrá dar conformidad y dejar una reseña.

### 7.9 Comisiones y pagos

1. Vaya a **Comisiones**.
2. Revise el saldo, las comisiones pendientes y el historial de pagos.
3. Pulse **Registrar pago**.
4. Indique método de pago, número de operación, monto y comprobante.
5. Envíe el pago.
6. El administrador validará el pago.

Si la deuda supera el límite configurado, el técnico queda bloqueado para ofertar hasta regularizar el saldo. El bloqueo se sincroniza con la validación de pagos y la revisión programada.

### 7.10 Reseñas y reclamos

- En **Mis servicios**, el técnico puede responder una reseña del cliente.
- También puede responder un reclamo y adjuntar la información que considere necesaria.
- La moderación de reseñas y la gestión de reclamos corresponden al administrador.

## 8. Uso para administradores

### 8.1 Panel de inicio

El panel administrativo muestra indicadores generales y accesos a los módulos de gestión. El menú lateral contiene **Inicio**, **Notificaciones**, **Mi cuenta**, **Técnicos**, **Usuarios**, **Reseñas**, **Reclamos**, **Pagos y deudores**, **Reportes**, **Catálogos**, **Parámetros** y **Auditoría**.

### 8.2 Verificar técnicos

1. Vaya a **Técnicos**.
2. Filtre por estado de verificación o busque por nombre, correo, DNI o celular.
3. Abra el detalle del técnico.
4. Revise contacto, modalidades, calificación, servicios, saldo y bloqueo por deuda.
5. Pulse **Aprobar técnico**, **Observar** o **Rechazar**.
6. Si observa o rechaza, escriba el motivo.

Los documentos de verificación no están disponibles porque el backend no expone un controlador para ellos. La interfaz no muestra una sección que prometa esa función.

### 8.3 Gestionar usuarios

1. Vaya a **Usuarios**.
2. Filtre por rol, estado o búsqueda.
3. Abra el detalle del usuario.
4. Para suspender, pulse **Suspender** e indique el motivo.
5. Para reactivar, pulse **Activar**.

### 8.4 Moderar reseñas

1. Vaya a **Reseñas**.
2. Filtre por estado.
3. Revise la reseña y su reporte.
4. Pulse **Ocultar**, **Publicar** o **Rechazar** según corresponda.
5. Registre el motivo de la decisión.

### 8.5 Atender reclamos

1. Vaya a **Reclamos**.
2. Filtre por estado.
3. Abra el detalle y revise la descripción, las fotos y la respuesta del técnico.
4. Pulse **Iniciar revisión**, **Resolver reclamo** o **Cerrar reclamo**.
5. Escriba la resolución y las acciones tomadas.

### 8.6 Validar pagos y deudores

1. Vaya a **Pagos y deudores**.
2. Revise los pagos pendientes y los comprobantes.
3. Pulse **Ver comprobante** para revisar el archivo.
4. Pulse **Validar pago** o rechace la validación con un motivo.
5. Revise la lista de técnicos con deuda pendiente.

No existe un endpoint para anular un pago ya validado ni para retirar manualmente el bloqueo por deuda. La interfaz no ofrece esas acciones.

### 8.7 Gestionar catálogos

1. Vaya a **Catálogos**.
2. Seleccione el catálogo: tipos de equipo, tipos de servicio, especialidades o distritos.
3. Pulse **Nuevo** para crear un registro.
4. Pulse **Editar** para modificar nombre o descripción.
5. Use **Activar** o **Desactivar** para cambiar el estado.

Los catálogos no se eliminan físicamente porque el backend no expone `DELETE`.

### 8.8 Configurar parámetros

1. Vaya a **Parámetros**.
2. Revise los parámetros del sistema: comisión, tope de movilidad, garantía, días de conformidad automática, límite de deuda, etc.
3. Edite el valor y guarde los cambios.
4. Verifique que el nuevo valor se refleje en los flujos correspondientes.

### 8.9 Consultar reportes

1. Vaya a **Reportes**.
2. Seleccione el periodo y los filtros.
3. Revise los indicadores y las tablas.
4. Pulse **Exportar Excel** para descargar el reporte.

### 8.10 Consultar auditoría

1. Vaya a **Auditoría**.
2. Filtre por entidad, acción, usuario o fecha.
3. Revise el detalle del registro.

La auditoría es de solo lectura. No se puede editar ni eliminar desde la interfaz.

## 9. Acciones comunes

### 9.1 Navegación

- Use el menú lateral para cambiar de módulo.
- En móvil, pulse el icono de menú para abrir la navegación.
- Use la barra superior para volver al inicio o abrir el menú de usuario.

### 9.2 Notificaciones

- El icono de campana muestra el número de notificaciones no leídas.
- La bandeja permite filtrar por no leídas.
- Pulse una notificación para abrir el recurso relacionado.
- Pulse **Marcar todas como leídas** para limpiar el contador.

### 9.3 Aviso de conexión

Si la aplicación detecta que el navegador perdió la conexión, muestra un aviso. Las acciones que requieren red pueden fallar; espere a que la conexión se restablezca y vuelva a intentarlo.

### 9.4 Sesión expirada

Si la sesión expira, la aplicación muestra un aviso y redirige al inicio de sesión. Vuelva a ingresar con sus credenciales. La sesión no se comparte entre pestañas porque se guarda en `sessionStorage`.

### 9.5 Accesibilidad

- La aplicación se puede usar con teclado.
- Los formularios tienen etiquetas y mensajes de error.
- Los diálogos gestionan el foco.
- Las animaciones respetan la preferencia de movimiento reducido.
- El diseño se adapta a 360 px, 768 px y 1280 px.

## 10. Preguntas frecuentes

| Pregunta                                                | Respuesta                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| ¿Cómo recupero mi contraseña?                           | La recuperación automática no está disponible; contacte al administrador.   |
| ¿Puedo cambiar mi contraseña?                           | No desde la SPA; el backend no expone ese endpoint.                         |
| ¿Puedo editar mis datos de cliente?                     | No; el perfil general es de solo lectura.                                   |
| ¿Puedo agregar fotos después de publicar una solicitud? | No; las fotos se adjuntan al crear.                                         |
| ¿Por qué no veo solicitudes disponibles?                | El técnico debe estar aprobado y sin bloqueo por deuda.                     |
| ¿Por qué no puedo finalizar el servicio?                | Verifique que la constancia de entrega esté confirmada.                     |
| ¿Cómo se calcula la comisión?                           | Con el porcentaje configurado por el administrador.                         |
| ¿Qué pasa si no doy conformidad?                        | Se aplica la conformidad automática después del plazo configurado.          |
| ¿Puedo anular un pago?                                  | No; el backend no expone esa operación.                                     |
| ¿La aplicación funciona sin Internet?                   | No para operaciones que requieren el backend; muestra un aviso de conexión. |
| ¿Por qué se cierra mi sesión al cambiar de pestaña?     | La sesión se guarda en `sessionStorage` y no se comparte entre pestañas.    |
| ¿Dónde veo mis notificaciones?                          | En el menú **Notificaciones** o en el icono de campana.                     |

## 11. Soporte

Para reportar un problema, contacte al administrador del sistema e indique:

- Correo de la cuenta.
- Rol.
- Módulo y pantalla.
- Acción realizada.
- Mensaje de error, si aparece.
- Fecha y hora aproximada.
- Captura de pantalla, si es posible.

No comparta su contraseña ni tokens de acceso. El administrador no necesita su contraseña para revisar un incidente.

## 12. Glosario

| Término          | Definición                                                 |
| ---------------- | ---------------------------------------------------------- |
| Solicitud        | Publicación de un cliente que necesita un servicio técnico |
| Oferta           | Propuesta de precio y plazo enviada por un técnico         |
| Contraoferta     | Propuesta alternativa dentro de una negociación            |
| Servicio         | Trabajo aceptado y en ejecución                            |
| Constancia       | Registro fotográfico de recepción o entrega en taller      |
| Conformidad      | Aceptación del cliente sobre el servicio finalizado        |
| Reseña           | Calificación y comentario del cliente                      |
| Reclamo          | Reporte de un problema después del servicio                |
| Comisión         | Monto que el técnico paga a la plataforma                  |
| Deuda            | Comisión pendiente que puede bloquear al técnico           |
| PIN de inicio    | Código que confirma el inicio del servicio                 |
| Ajuste de precio | Cambio propuesto por el técnico después del diagnóstico    |
| Notificación     | Aviso dentro de la aplicación sobre un evento relevante    |
