import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8082/api';

interface CatalogoConId {
  readonly id: number;
  readonly nombre: string;
}

interface CatalogosSolicitud {
  readonly equipos: readonly CatalogoConId[];
  readonly servicios: readonly CatalogoConId[];
  readonly distritos: readonly CatalogoConId[];
}

interface TecnicoAdminApi {
  readonly id: number;
  readonly correo: string;
  readonly estadoVerificacion: string;
}

interface SesionPrueba {
  readonly correo: string;
  readonly password: string;
}

interface ModalidadesTecnico {
  readonly ofreceDomicilio: boolean;
  readonly ofreceTaller: boolean;
}

interface OpcionesSolicitud {
  readonly modalidad?: string;
}

// PNG de 1x1 píxel para adjuntarlo como foto de la solicitud y de los avances.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test.describe('Flujo completo del servicio', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('aceptación, ejecución, ajuste, mensajería, finalización y conformidad', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(180_000);

    const catalogos = await obtenerCatalogos(request);
    const distrito = catalogos.distritos[0];
    const tecnico = await registrarTecnico(request, distrito.id, testInfo.workerIndex);
    await aprobarTecnico(request, tecnico.correo);
    const cliente = await registrarCliente(request, testInfo.workerIndex);
    const descripcion = `Servicio E2E ${Date.now()}-${testInfo.workerIndex}: la laptop no enciende.`;

    await iniciarSesion(page, cliente);
    await publicarSolicitud(page, catalogos, distrito, descripcion);
    const solicitudId = extraerId(page.url(), '/app/cliente/solicitudes/');

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/solicitudes/${solicitudId}`);
    await expect(page.getByText(descripcion, { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Enviar oferta' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}/ofertar$`));
    await page.getByLabel('Precio del servicio').fill('150');
    await page.getByLabel('Tiempo estimado (horas)').fill('3');
    await page.getByLabel('Costo de movilidad').fill('0');
    await page.getByLabel('Costo de diagnóstico').fill('20');
    await page.getByRole('button', { name: 'Enviar oferta' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}$`));
    await expect(page.getByText('Tu oferta', { exact: true })).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/solicitudes/${solicitudId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Ofertas recibidas' })).toBeVisible();
    await expect(page.getByText('María Quispe')).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Aceptar oferta' }).click();
    const dialogoAceptar = page.getByRole('dialog');
    await expect(dialogoAceptar).toBeVisible();
    await esperarAnimaciones(dialogoAceptar);
    await expect(dialogoAceptar).toContainText('¿Aceptas la oferta de María Quispe');
    await auditar(page, 'mat-dialog-container');
    await dialogoAceptar.getByRole('button', { name: 'Aceptar y crear servicio' }).click();

    await expect(dialogoAceptar).toBeHidden();
    await expect(page).toHaveURL(/\/app\/cliente\/servicios\/\d+$/);
    const servicioId = extraerId(page.url(), '/app/cliente/servicios/');
    await expect(page.getByText(`Servicio #${servicioId}`).first()).toBeVisible();
    await expect(page.locator('.detalle__badges')).toContainText('Programado');
    await expect(page.getByRole('heading', { level: 2, name: 'PIN de inicio' })).toBeVisible();
    const pin = await leerPin(page);
    expect(pin).toMatch(/^\d{4}$/);
    await auditar(page);

    await page.goto('/app/cliente/servicios');
    await expect(page.getByRole('heading', { level: 1, name: 'Mis servicios' })).toBeVisible();
    await expect(page.getByText(`Servicio #${servicioId}`)).toBeVisible();
    await expect(page.getByText('Programado', { exact: true }).first()).toBeVisible();
    await auditar(page);

    await page.goto(`/app/cliente/servicios/${servicioId}`);
    await enviarMensaje(page, 'Estoy en casa, avísame cuando llegues.');
    await expect(page.getByText('Estoy en casa, avísame cuando llegues.')).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto('/app/tecnico/servicios');
    await expect(page.getByRole('heading', { level: 1, name: 'Mis servicios' })).toBeVisible();
    await expect(page.getByText(`Servicio #${servicioId}`)).toBeVisible();
    await auditar(page);

    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    await expect(page.getByText('Estoy en casa, avísame cuando llegues.')).toBeVisible();
    await enviarMensaje(page, 'Voy en camino, llego en 15 minutos.');
    await expect(page.getByText('Voy en camino, llego en 15 minutos.')).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Iniciar traslado' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('Técnico en camino');
    await expect(page.getByText('Solicita al cliente el PIN de 4 dígitos')).toBeVisible();

    await page.getByRole('button', { name: 'Validar PIN e iniciar' }).click();
    const dialogoPin = page.getByRole('dialog');
    await expect(dialogoPin).toBeVisible();
    await esperarAnimaciones(dialogoPin);
    await dialogoPin.getByLabel('PIN de inicio').fill(pin);
    await dialogoPin.getByLabel('Comentario (opcional)').fill('Llegué al domicilio.');
    await auditar(page, 'mat-dialog-container');
    await dialogoPin.getByRole('button', { name: 'Validar e iniciar' }).click();
    await expect(dialogoPin).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('En proceso');

    await page.getByRole('button', { name: 'Registrar diagnóstico' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('En diagnóstico');

    const avances = page.locator('app-avances-servicio');
    await avances.getByLabel('Descripción').fill('La placa presenta sulfatación en el conector.');
    await avances.locator('input[type="file"]').setInputFiles({
      name: 'diagnostico.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(avances.getByText('diagnostico.png')).toBeVisible();
    await avances.getByRole('button', { name: 'Registrar avance' }).click();
    await expect(avances.getByText('La placa presenta sulfatación en el conector.')).toBeVisible();
    await expect(avances.locator('app-imagen-autenticada img')).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Proponer ajuste' }).click();
    const dialogoAjuste = page.getByRole('dialog');
    await expect(dialogoAjuste).toBeVisible();
    await esperarAnimaciones(dialogoAjuste);
    await dialogoAjuste.getByLabel('Nuevo monto total').fill('180');
    await dialogoAjuste
      .getByLabel('Justificación')
      .fill('Se requiere reemplazar el conector de carga.');
    await dialogoAjuste.locator('input[type="file"]').setInputFiles({
      name: 'evidencia.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await auditar(page, 'mat-dialog-container');
    await dialogoAjuste.getByRole('button', { name: 'Enviar propuesta' }).click();

    await expect(dialogoAjuste).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Ajuste pendiente');
    await expect(
      page.getByRole('heading', { level: 3, name: 'Ajuste pendiente de respuesta' }),
    ).toBeVisible();
    await expect(page.getByText('S/ 180.00').first()).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    await expect(page.getByText('Voy en camino, llego en 15 minutos.')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Ajuste pendiente de respuesta' }),
    ).toBeVisible();
    await expect(page.getByText('S/ 180.00').first()).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Aprobar ajuste' }).click();
    const dialogoAprobar = page.getByRole('dialog');
    await expect(dialogoAprobar).toBeVisible();
    await esperarAnimaciones(dialogoAprobar);
    await auditar(page, 'mat-dialog-container');
    await dialogoAprobar.getByRole('button', { name: 'Aprobar ajuste' }).click();
    await expect(dialogoAprobar).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('En diagnóstico');
    await expect(page.getByText('Ajuste de precio aprobado; nuevo monto S/ 180.00')).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    await expect(page.locator('.detalle__badges')).toContainText('En diagnóstico');
    await expect(page.getByText('S/ 180.00').first()).toBeVisible();

    await page.getByRole('button', { name: 'Reanudar trabajo' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('En proceso');

    await page.getByRole('button', { name: 'Finalizar servicio' }).click();
    const dialogoFinalizar = page.getByRole('dialog');
    await expect(dialogoFinalizar).toBeVisible();
    await esperarAnimaciones(dialogoFinalizar);
    await expect(dialogoFinalizar).toContainText('S/ 180.00');
    await dialogoFinalizar.getByRole('radio', { name: 'Yape' }).check();
    await auditar(page, 'mat-dialog-container');
    await dialogoFinalizar.getByRole('button', { name: 'Finalizar servicio' }).click();

    await expect(dialogoFinalizar).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Finalizado');
    await expect(
      page.getByText('Servicio finalizado; falta la conformidad del cliente.'),
    ).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    await expect(page.locator('.detalle__badges')).toContainText('Finalizado');
    await expect(page.getByText('Monto final').first()).toBeVisible();
    await expect(page.getByText('S/ 180.00').first()).toBeVisible();
    await expect(page.getByText('Yape', { exact: true })).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Confirmar conformidad' }).click();
    const dialogoConformidad = page.getByRole('dialog');
    await expect(dialogoConformidad).toBeVisible();
    await esperarAnimaciones(dialogoConformidad);
    await auditar(page, 'mat-dialog-container');
    await dialogoConformidad.getByRole('button', { name: 'Confirmar conformidad' }).click();

    await expect(dialogoConformidad).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Confirmado');
    await expect(page.getByText('Servicio confirmado.')).toBeVisible();
    await expect(page.getByText('El cliente confirmó la conformidad del servicio.')).toBeVisible();
    await auditar(page);

    await page.goto('/app/cliente/servicios');
    await expect(page.getByText(`Servicio #${servicioId}`)).toBeVisible();
    await expect(page.getByText('Confirmado', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: /^Cerrados/ }).click();
    await expect(page.getByText(`Servicio #${servicioId}`)).toBeVisible();
    await page.getByRole('button', { name: /^Cancelados/ }).click();
    await expect(page.getByText('No hay servicios en este filtro')).toBeVisible();
    await auditar(page);
  });

  test('taller: constancias, finalización, reseña, reclamo, moderación y pago de comisión', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(300_000);

    const sufijo = `${Date.now()}-${testInfo.workerIndex}`;
    const catalogos = await obtenerCatalogos(request);
    const distrito = catalogos.distritos[0];
    const tecnico = await registrarTecnico(request, distrito.id, testInfo.workerIndex, {
      ofreceDomicilio: false,
      ofreceTaller: true,
    });
    await aprobarTecnico(request, tecnico.correo);
    const cliente = await registrarCliente(request, testInfo.workerIndex);
    const descripcionServicio = `Servicio de taller E2E ${sufijo}: la laptop no carga.`;
    const comentarioResena = `Reseña de taller E2E ${sufijo}: atención puntual y clara.`;
    const respuestaResena = `Respuesta del técnico E2E ${sufijo}: gracias por tu comentario.`;
    const motivoReporte = `Motivo del reporte E2E ${sufijo}: contiene datos imprecisos.`;
    const descripcionReclamo = `Reclamo de taller E2E ${sufijo}: el equipo volvió con la tapa suelta.`;
    const respuestaReclamo = `Respuesta al reclamo E2E ${sufijo}: revisaremos la tapa sin costo.`;
    const resolucionReclamo = `Resolución E2E ${sufijo}: se coordinó la revisión y se validó el equipo.`;
    const admin: SesionPrueba = { correo: 'admin@fixtech.pe', password: 'Admin123!' };

    await iniciarSesion(page, cliente);
    await publicarSolicitud(page, catalogos, distrito, descripcionServicio, {
      modalidad: 'En taller',
    });
    const solicitudId = extraerId(page.url(), '/app/cliente/solicitudes/');

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/solicitudes/${solicitudId}`);
    await expect(page.getByText(descripcionServicio, { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Enviar oferta' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}/ofertar$`));
    await expect(page.getByLabel('Modalidad de la oferta')).toContainText('En taller');
    await expect(page.getByLabel('Costo de movilidad')).toBeDisabled();
    await page.getByLabel('Precio del servicio').fill('200');
    await page.getByLabel('Tiempo estimado (horas)').fill('2');
    await page.getByLabel('Costo de diagnóstico').fill('20');
    await page.getByRole('button', { name: 'Enviar oferta' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}$`));
    await expect(page.getByText('Tu oferta', { exact: true })).toBeVisible();
    await expect(page.getByText('S/ 200.00').first()).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/solicitudes/${solicitudId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Ofertas recibidas' })).toBeVisible();
    await page.getByRole('button', { name: 'Aceptar oferta' }).click();
    const dialogoAceptar = page.getByRole('dialog');
    await expect(dialogoAceptar).toBeVisible();
    await esperarAnimaciones(dialogoAceptar);
    await expect(dialogoAceptar).toContainText('S/ 200.00');
    await dialogoAceptar.getByRole('button', { name: 'Aceptar y crear servicio' }).click();

    await expect(dialogoAceptar).toBeHidden();
    await expect(page).toHaveURL(/\/app\/cliente\/servicios\/\d+$/);
    const servicioId = extraerId(page.url(), '/app/cliente/servicios/');
    await expect(page.locator('.detalle__badges')).toContainText('Programado');
    await expect(page.locator('.detalle__badges')).toContainText('En taller');

    const constanciasIniciales = page.locator('app-constancias-servicio');
    await expect(
      constanciasIniciales.getByRole('heading', { level: 2, name: 'Constancias del servicio' }),
    ).toBeVisible();
    await expect(
      constanciasIniciales.getByText('Aún no hay constancias registradas para este servicio.'),
    ).toBeVisible();
    await expect(
      constanciasIniciales.getByText('Falta la constancia de recepción del equipo.'),
    ).toBeVisible();
    const resenaInicial = page.locator('app-resena-servicio');
    await expect(
      resenaInicial.getByText('La reseña se habilita cuando el servicio esté confirmado.'),
    ).toBeVisible();
    const reclamosIniciales = page.locator('app-reclamos-servicio');
    await expect(
      reclamosIniciales.getByText('Los reclamos se habilitan cuando el servicio está confirmado.'),
    ).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    await expect(page.locator('.detalle__badges')).toContainText('Programado');
    const constancias = page.locator('app-constancias-servicio');
    await constancias.getByRole('button', { name: 'Registrar constancia de recepción' }).click();
    const dialogoRecepcion = page.getByRole('dialog');
    await expect(dialogoRecepcion).toBeVisible();
    await esperarAnimaciones(dialogoRecepcion);
    await dialogoRecepcion
      .getByLabel('Accesorios entregados (opcional)')
      .fill('Cargador original y funda.');
    await dialogoRecepcion
      .getByLabel('Observaciones (opcional)')
      .fill('Equipo recibido con un rayón en la tapa.');
    await dialogoRecepcion.locator('input[type="file"]').setInputFiles({
      name: 'recepcion.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(dialogoRecepcion.getByText('recepcion.png')).toBeVisible();
    await auditar(page, 'mat-dialog-container');
    await dialogoRecepcion.getByRole('button', { name: 'Registrar constancia' }).click();

    await expect(dialogoRecepcion).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Equipo recibido');
    const constanciaRecepcion = constancias
      .locator('.constancia')
      .filter({ hasText: 'Recepción del equipo' });
    await expect(constanciaRecepcion.getByText('Pendiente de confirmación')).toBeVisible();
    await expect(constanciaRecepcion.locator('app-imagen-autenticada img')).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    const constanciasCliente = page.locator('app-constancias-servicio');
    const recepcionCliente = constanciasCliente
      .locator('.constancia')
      .filter({ hasText: 'Recepción del equipo' });
    await expect(recepcionCliente.getByText('Pendiente de confirmación')).toBeVisible();
    await expect(recepcionCliente.locator('app-imagen-autenticada img')).toBeVisible();
    await expect(
      constanciasCliente.getByText('Falta la constancia de recepción del equipo.'),
    ).toHaveCount(0);
    await recepcionCliente.getByRole('button', { name: 'Confirmar constancia' }).click();
    await expect(recepcionCliente.getByText('Confirmada', { exact: true })).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    await expect(page.locator('.detalle__badges')).toContainText('Equipo recibido');
    await page.getByRole('button', { name: 'Iniciar diagnóstico' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('En diagnóstico');
    await page.getByRole('button', { name: 'Iniciar reparación' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('En reparación');
    await page.getByRole('button', { name: 'Marcar listo para recoger' }).click();
    await expect(page.locator('.detalle__badges')).toContainText('Listo para recoger');
    await expect(page.getByRole('button', { name: 'Finalizar servicio' })).toHaveCount(0);

    const constanciasTecnico = page.locator('app-constancias-servicio');
    await expect(
      constanciasTecnico.getByText('Falta la constancia de entrega del equipo.'),
    ).toBeVisible();
    await constanciasTecnico
      .getByRole('button', { name: 'Registrar constancia de entrega' })
      .click();
    const dialogoEntrega = page.getByRole('dialog');
    await expect(dialogoEntrega).toBeVisible();
    await esperarAnimaciones(dialogoEntrega);
    await dialogoEntrega
      .getByLabel('Observaciones (opcional)')
      .fill('Equipo entregado funcionando correctamente.');
    await dialogoEntrega.locator('input[type="file"]').setInputFiles({
      name: 'entrega.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(dialogoEntrega.getByText('entrega.png')).toBeVisible();
    await auditar(page, 'mat-dialog-container');
    await dialogoEntrega.getByRole('button', { name: 'Registrar constancia' }).click();

    await expect(dialogoEntrega).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Listo para recoger');
    const constanciaEntrega = page
      .locator('app-constancias-servicio .constancia')
      .filter({ hasText: 'Entrega del equipo' });
    await expect(constanciaEntrega.getByText('Pendiente de confirmación')).toBeVisible();
    await expect(constanciaEntrega.locator('app-imagen-autenticada img')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalizar servicio' })).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    const entregaCliente = page
      .locator('app-constancias-servicio .constancia')
      .filter({ hasText: 'Entrega del equipo' });
    await expect(entregaCliente.getByText('Pendiente de confirmación')).toBeVisible();
    await entregaCliente.getByRole('button', { name: 'Confirmar constancia' }).click();
    await expect(entregaCliente.getByText('Confirmada', { exact: true })).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    await page.getByRole('button', { name: 'Finalizar servicio' }).click();
    const dialogoFinalizar = page.getByRole('dialog');
    await expect(dialogoFinalizar).toBeVisible();
    await esperarAnimaciones(dialogoFinalizar);
    await expect(dialogoFinalizar).toContainText('S/ 200.00');
    await dialogoFinalizar.getByRole('radio', { name: 'Yape' }).check();
    await auditar(page, 'mat-dialog-container');
    await dialogoFinalizar.getByRole('button', { name: 'Finalizar servicio' }).click();

    await expect(dialogoFinalizar).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Finalizado');
    await expect(
      page.getByText('Servicio finalizado; falta la conformidad del cliente.'),
    ).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    await expect(page.locator('.detalle__badges')).toContainText('Finalizado');
    await expect(page.getByText('Monto final').first()).toBeVisible();
    await expect(page.getByText('S/ 200.00').first()).toBeVisible();
    await expect(page.getByText('Yape', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar conformidad' }).click();
    const dialogoConformidad = page.getByRole('dialog');
    await expect(dialogoConformidad).toBeVisible();
    await esperarAnimaciones(dialogoConformidad);
    await auditar(page, 'mat-dialog-container');
    await dialogoConformidad.getByRole('button', { name: 'Confirmar conformidad' }).click();

    await expect(dialogoConformidad).toBeHidden();
    await expect(page.locator('.detalle__badges')).toContainText('Confirmado');
    await expect(page.getByText('Servicio confirmado.')).toBeVisible();

    const resena = page.locator('app-resena-servicio');
    await expect(resena.getByRole('button', { name: '4 de 5 estrellas' })).toBeVisible();
    await resena.getByRole('button', { name: '4 de 5 estrellas' }).click();
    await resena.getByLabel('Comentario (opcional)').fill(comentarioResena);
    await auditar(page);
    await resena.getByRole('button', { name: 'Publicar reseña' }).click();
    await expect(resena.getByText(comentarioResena)).toBeVisible();
    await expect(resena.getByRole('img', { name: 'Calificación: 4 de 5 estrellas' })).toBeVisible();
    await expect(resena.getByText('Visible', { exact: true })).toBeVisible();
    await expect(page.locator('.detalle__badges')).toContainText('Calificado');

    const reclamos = page.locator('app-reclamos-servicio');
    await expect(reclamos.getByRole('button', { name: 'Registrar reclamo' })).toBeVisible();
    await reclamos.getByRole('button', { name: 'Registrar reclamo' }).click();
    const dialogoReclamo = page.getByRole('dialog');
    await expect(dialogoReclamo).toBeVisible();
    await esperarAnimaciones(dialogoReclamo);
    await dialogoReclamo.getByLabel('Descripción del reclamo').fill(descripcionReclamo);
    await dialogoReclamo.locator('input[type="file"]').setInputFiles({
      name: 'reclamo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(dialogoReclamo.getByText('reclamo.png')).toBeVisible();
    await auditar(page, 'mat-dialog-container');
    await dialogoReclamo.getByRole('button', { name: 'Registrar reclamo' }).click();

    await expect(dialogoReclamo).toBeHidden();
    const reclamo = reclamos.locator('.reclamo').filter({ hasText: descripcionReclamo });
    await expect(reclamo.getByText('Abierto', { exact: true })).toBeVisible();
    await expect(reclamo.getByText(descripcionReclamo)).toBeVisible();
    await expect(reclamo.locator('app-imagen-autenticada img')).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto(`/app/tecnico/servicios/${servicioId}`);
    const resenaTecnico = page.locator('app-resena-servicio');
    await expect(resenaTecnico.getByText(comentarioResena)).toBeVisible();
    await resenaTecnico.getByRole('button', { name: 'Responder reseña' }).click();
    const dialogoRespuestaResena = page.getByRole('dialog');
    await expect(dialogoRespuestaResena).toBeVisible();
    await esperarAnimaciones(dialogoRespuestaResena);
    await dialogoRespuestaResena.getByLabel('Tu respuesta').fill(respuestaResena);
    await auditar(page, 'mat-dialog-container');
    await dialogoRespuestaResena.getByRole('button', { name: 'Publicar respuesta' }).click();

    await expect(dialogoRespuestaResena).toBeHidden();
    await expect(resenaTecnico.getByText(respuestaResena)).toBeVisible();
    await resenaTecnico.getByRole('button', { name: 'Reportar reseña' }).click();
    const dialogoReporte = page.getByRole('dialog');
    await expect(dialogoReporte).toBeVisible();
    await esperarAnimaciones(dialogoReporte);
    await dialogoReporte.getByLabel('Motivo del reporte').fill(motivoReporte);
    await dialogoReporte.getByRole('button', { name: 'Reportar reseña' }).click();

    await expect(dialogoReporte).toBeHidden();
    await expect(resenaTecnico.getByText('Reseña reportada.')).toBeVisible();
    await expect(resenaTecnico.getByText('Reportada', { exact: true })).toBeVisible();

    const reclamoTecnico = page
      .locator('app-reclamos-servicio .reclamo')
      .filter({ hasText: descripcionReclamo });
    await expect(reclamoTecnico.getByText(descripcionReclamo)).toBeVisible();
    await reclamoTecnico.getByRole('button', { name: 'Responder reclamo' }).click();
    const dialogoRespuestaReclamo = page.getByRole('dialog');
    await expect(dialogoRespuestaReclamo).toBeVisible();
    await esperarAnimaciones(dialogoRespuestaReclamo);
    await dialogoRespuestaReclamo.getByLabel('Respuesta al reclamo').fill(respuestaReclamo);
    await auditar(page, 'mat-dialog-container');
    await dialogoRespuestaReclamo.getByRole('button', { name: 'Publicar respuesta' }).click();

    await expect(dialogoRespuestaReclamo).toBeHidden();
    await expect(reclamoTecnico.getByText(respuestaReclamo)).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, admin);
    await page.goto('/app/admin/resenas');
    await expect(page.getByRole('heading', { level: 1, name: 'Reseñas' })).toBeVisible();
    await elegirOpcion(page, 'Estado de la reseña', 'Reportada');
    await page.getByRole('button', { name: 'Filtrar' }).click();
    const resenaReportada = page.locator('article.resena').filter({ hasText: comentarioResena });
    await expect(resenaReportada).toBeVisible();
    await expect(resenaReportada.getByText(motivoReporte)).toBeVisible();
    await expect(resenaReportada.getByText(respuestaResena)).toBeVisible();
    await auditar(page);
    await resenaReportada.getByRole('button', { name: 'Habilitar reseña' }).click();
    const dialogoModeracion = page.getByRole('dialog');
    await expect(dialogoModeracion).toBeVisible();
    await esperarAnimaciones(dialogoModeracion);
    await auditar(page, 'mat-dialog-container');
    await dialogoModeracion.getByRole('button', { name: 'Habilitar reseña' }).click();

    await expect(dialogoModeracion).toBeHidden();
    await expect(page.getByText('Reseña habilitada nuevamente.')).toBeVisible();
    await expect(resenaReportada).toHaveCount(0);
    await elegirOpcion(page, 'Estado de la reseña', 'Visible');
    await page.getByRole('button', { name: 'Filtrar' }).click();
    const resenaVisible = page.locator('article.resena').filter({ hasText: comentarioResena });
    await expect(resenaVisible).toBeVisible();
    await expect(resenaVisible.getByText('Visible', { exact: true })).toBeVisible();
    await auditar(page);

    await page.goto('/app/admin/reclamos');
    await expect(page.getByRole('heading', { level: 1, name: 'Reclamos' })).toBeVisible();
    const reclamoAdmin = page.locator('article.reclamo').filter({ hasText: descripcionReclamo });
    await expect(reclamoAdmin).toBeVisible();
    await reclamoAdmin.getByRole('button', { name: 'Ver detalle' }).click();
    await expect(
      reclamoAdmin.getByRole('heading', { level: 3, name: 'Detalle del reclamo' }),
    ).toBeVisible();
    await expect(reclamoAdmin.getByText(respuestaReclamo)).toBeVisible();
    await expect(reclamoAdmin.locator('app-imagen-autenticada img')).toBeVisible();
    await auditar(page);

    await reclamoAdmin.getByRole('button', { name: 'Iniciar revisión' }).click();
    const dialogoRevision = page.getByRole('dialog');
    await expect(dialogoRevision).toBeVisible();
    await esperarAnimaciones(dialogoRevision);
    await dialogoRevision.getByRole('button', { name: 'Iniciar revisión' }).click();
    await expect(dialogoRevision).toBeHidden();
    await expect(page.getByText('El reclamo pasó a revisión.')).toBeVisible();
    await expect(reclamoAdmin.getByText('En revisión', { exact: true }).first()).toBeVisible();

    await reclamoAdmin.getByRole('button', { name: 'Resolver reclamo' }).click();
    const dialogoResolver = page.getByRole('dialog');
    await expect(dialogoResolver).toBeVisible();
    await esperarAnimaciones(dialogoResolver);
    await dialogoResolver.getByLabel('Resolución del reclamo').fill(resolucionReclamo);
    await auditar(page, 'mat-dialog-container');
    await dialogoResolver.getByRole('button', { name: 'Resolver reclamo' }).click();
    await expect(dialogoResolver).toBeHidden();
    await expect(page.getByText('Reclamo resuelto. Se notificó a las partes.')).toBeVisible();
    await expect(reclamoAdmin.getByText('Resuelto', { exact: true }).first()).toBeVisible();
    await expect(reclamoAdmin.getByText(resolucionReclamo)).toBeVisible();

    await reclamoAdmin.getByRole('button', { name: 'Cerrar reclamo' }).click();
    const dialogoCerrar = page.getByRole('dialog');
    await expect(dialogoCerrar).toBeVisible();
    await esperarAnimaciones(dialogoCerrar);
    await expect(dialogoCerrar.getByLabel('Resolución del reclamo')).toHaveValue(resolucionReclamo);
    await auditar(page, 'mat-dialog-container');
    await dialogoCerrar.getByRole('button', { name: 'Cerrar reclamo' }).click();
    await expect(dialogoCerrar).toBeHidden();
    await expect(page.getByText('Reclamo cerrado.')).toBeVisible();
    await expect(reclamoAdmin.getByText('Cerrado', { exact: true }).first()).toBeVisible();
    await expect(
      reclamoAdmin.getByText('El reclamo está cerrado y no admite más cambios de estado.'),
    ).toBeVisible();
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/servicios/${servicioId}`);
    const resenaFinal = page.locator('app-resena-servicio');
    await expect(resenaFinal.getByText(comentarioResena)).toBeVisible();
    await expect(resenaFinal.getByText(respuestaResena)).toBeVisible();
    await expect(resenaFinal.getByText('Visible', { exact: true })).toBeVisible();
    const reclamoFinal = page
      .locator('app-reclamos-servicio .reclamo')
      .filter({ hasText: descripcionReclamo });
    await expect(reclamoFinal.getByText('Cerrado', { exact: true })).toBeVisible();
    await expect(reclamoFinal.getByText(resolucionReclamo)).toBeVisible();
    await expect(
      page.locator('app-reclamos-servicio').getByRole('button', { name: 'Registrar reclamo' }),
    ).toBeVisible();
    await auditar(page);

    // Comisión generada al confirmar la conformidad: el técnico la paga y administración la valida.
    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto('/app/tecnico/comisiones');
    await expect(page.getByRole('heading', { level: 1, name: 'Comisiones y pagos' })).toBeVisible();
    await expect(page.locator('.metrica').filter({ hasText: 'Saldo pendiente' })).toContainText(
      'S/ 12.00',
    );
    const comision = page.locator('.comision').filter({ hasText: `Servicio #${servicioId}` });
    await expect(comision).toBeVisible();
    await comision.getByRole('checkbox').check();
    await page.getByLabel('Número de operación').fill(`OP-E2E-${sufijo}`);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'comprobante-e2e.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(page.getByText('comprobante-e2e.png')).toBeVisible();
    await auditar(page);
    await page.getByRole('button', { name: 'Registrar pago' }).click();

    await expect(page.getByText('Pago registrado. Queda pendiente de validación.')).toBeVisible();
    const pagoTecnico = page.locator('.pago').first();
    await expect(pagoTecnico).toContainText('En revisión');
    await expect(pagoTecnico).toContainText(`OP-E2E-${sufijo}`);
    await auditar(page);
    await pagoTecnico.getByRole('button', { name: 'Ver comprobante' }).click();
    const dialogoComprobanteTecnico = page.getByRole('dialog');
    await expect(dialogoComprobanteTecnico).toBeVisible();
    await esperarAnimaciones(dialogoComprobanteTecnico);
    await expect(dialogoComprobanteTecnico.locator('app-imagen-autenticada img')).toBeVisible();
    await auditar(page, 'mat-dialog-container');
    await dialogoComprobanteTecnico.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(dialogoComprobanteTecnico).toBeHidden();

    await cerrarSesion(page);
    await iniciarSesion(page, admin);
    await page.goto('/app/admin/comisiones');
    await expect(page.getByRole('heading', { level: 1, name: 'Comisiones y pagos' })).toBeVisible();
    const pagoAdmin = page.locator('article.pago').filter({ hasText: tecnico.correo });
    await expect(pagoAdmin).toBeVisible();
    await expect(pagoAdmin.getByText('En revisión', { exact: true }).first()).toBeVisible();
    await auditar(page);

    await page.getByRole('tab', { name: /Deudores/ }).click();
    const deudor = page.locator('article.deudor').filter({ hasText: tecnico.correo });
    await expect(deudor).toBeVisible();
    await expect(deudor).toContainText('S/ 12.00');
    await expect(deudor.getByText('Sin bloqueo', { exact: true })).toBeVisible();
    await auditar(page);
    await page.getByRole('tab', { name: 'Pagos de técnicos' }).click();

    await pagoAdmin.getByRole('button', { name: 'Validar pago' }).click();
    const dialogoValidacion = page.getByRole('dialog');
    await expect(dialogoValidacion).toBeVisible();
    await esperarAnimaciones(dialogoValidacion);
    await dialogoValidacion.getByRole('checkbox').check();
    await dialogoValidacion
      .getByLabel('Observación (opcional)')
      .fill('Pago verificado en la prueba E2E.');
    await auditar(page, 'mat-dialog-container');
    await dialogoValidacion.getByRole('button', { name: 'Validar pago', exact: true }).click();
    await expect(dialogoValidacion).toBeHidden();
    await expect(page.getByText('Pago validado y comisiones actualizadas.')).toBeVisible();
    await expect(pagoAdmin.getByText('Validado', { exact: true }).first()).toBeVisible();
    await auditar(page);

    await page.getByRole('tab', { name: /Deudores/ }).click();
    const panelDeudores = page.getByRole('tabpanel').filter({ hasText: 'Deuda pendiente total' });
    await expect(panelDeudores).toBeVisible();
    await expect(
      panelDeudores.getByText(/Técnicos deudores|No hay técnicos con deuda pendiente/),
    ).toBeVisible();
    await expect(page.locator('article.deudor').filter({ hasText: tecnico.correo })).toHaveCount(0);
    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto('/app/tecnico/comisiones');
    await expect(page.getByText('No tienes comisiones pendientes')).toBeVisible();
    await expect(page.locator('.metrica').filter({ hasText: 'Total pagado' })).toContainText(
      'S/ 12.00',
    );
    const pagoFinal = page.locator('.pago').first();
    await expect(pagoFinal.getByText('Validado', { exact: true })).toBeVisible();
    await expect(pagoFinal.getByText('Pago verificado en la prueba E2E.')).toBeVisible();
    await auditar(page);
  });
});

async function obtenerCatalogos(request: APIRequestContext): Promise<CatalogosSolicitud> {
  const [equipos, servicios, distritos] = await Promise.all([
    request.get(`${API_URL}/catalogos/tipos-equipo`),
    request.get(`${API_URL}/catalogos/tipos-servicio`),
    request.get(`${API_URL}/catalogos/distritos`),
  ]);
  expect(equipos.ok()).toBeTruthy();
  expect(servicios.ok()).toBeTruthy();
  expect(distritos.ok()).toBeTruthy();

  const equiposJson = (await equipos.json()) as CatalogoConId[];
  const serviciosJson = (await servicios.json()) as CatalogoConId[];
  const distritosJson = (await distritos.json()) as CatalogoConId[];
  expect(equiposJson.length).toBeGreaterThan(0);
  expect(serviciosJson.length).toBeGreaterThan(0);
  expect(distritosJson.length).toBeGreaterThan(0);

  return {
    equipos: equiposJson.filter((item) => item.nombre !== 'Otro').slice(0, 1),
    servicios: serviciosJson.slice(0, 1),
    distritos: distritosJson.slice(0, 1),
  };
}

async function registrarTecnico(
  request: APIRequestContext,
  distritoId: number,
  workerIndex: number,
  modalidades: ModalidadesTecnico = { ofreceDomicilio: true, ofreceTaller: false },
): Promise<SesionPrueba> {
  const especialidades = await request.get(`${API_URL}/catalogos/especialidades`);
  expect(especialidades.ok()).toBeTruthy();
  const especialidadesJson = (await especialidades.json()) as CatalogoConId[];
  expect(especialidadesJson.length).toBeGreaterThan(0);

  const sufijo = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  const correo = `e2e.servicio.tecnico.${sufijo}@fixtech.pe`;
  const dni = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
  const celular = `9${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;

  const registro = await request.post(`${API_URL}/auth/register/tecnico`, {
    data: {
      nombres: 'María',
      apellidos: `Quispe ${workerIndex}`,
      correo,
      celular,
      dni,
      password: 'Tecnico123!',
      aceptoTerminos: true,
      descripcion: 'Técnico creado por la prueba E2E del flujo de servicios.',
      aniosExperiencia: 5,
      ofreceDomicilio: modalidades.ofreceDomicilio,
      ofreceTaller: modalidades.ofreceTaller,
      direccionTaller: modalidades.ofreceTaller ? 'Av. Taller E2E 456, Piura' : null,
      especialidadIds: [especialidadesJson[0].id],
      distritoIds: [distritoId],
    },
  });
  expect(registro.status()).toBe(201);

  return { correo, password: 'Tecnico123!' };
}

async function aprobarTecnico(request: APIRequestContext, correo: string): Promise<void> {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { correo: 'admin@fixtech.pe', password: 'Admin123!' },
  });
  expect(login.ok()).toBeTruthy();
  const sesion = (await login.json()) as { accessToken: string };
  const cabecera = { Authorization: `Bearer ${sesion.accessToken}` };

  const listado = await request.get(`${API_URL}/admin/tecnicos`, {
    params: { busqueda: correo },
    headers: cabecera,
  });
  expect(listado.ok()).toBeTruthy();
  const tecnicos = (await listado.json()) as TecnicoAdminApi[];
  const tecnico = tecnicos.find((item) => item.correo === correo);
  expect(tecnico).toBeDefined();
  if (tecnico === undefined) {
    return;
  }

  const verificacion = await request.patch(`${API_URL}/admin/tecnicos/${tecnico.id}/verificacion`, {
    data: { estado: 'APROBADO', motivo: null },
    headers: cabecera,
  });
  expect(verificacion.ok()).toBeTruthy();
}

async function registrarCliente(
  request: APIRequestContext,
  workerIndex: number,
): Promise<SesionPrueba> {
  const sufijo = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  const correo = `e2e.servicio.cliente.${sufijo}@fixtech.pe`;
  const dni = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
  const celular = `9${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;
  const password = 'Cliente123!';

  const registro = await request.post(`${API_URL}/auth/register/cliente`, {
    data: {
      nombres: 'Cliente',
      apellidos: `E2E ${sufijo}`,
      correo,
      celular,
      dni,
      password,
      aceptoTerminos: true,
    },
  });
  expect(registro.status()).toBe(201);

  return { correo, password };
}

async function iniciarSesion(page: Page, sesion: SesionPrueba): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(sesion.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(sesion.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola');
}

async function cerrarSesion(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Abrir menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function publicarSolicitud(
  page: Page,
  catalogos: CatalogosSolicitud,
  distrito: CatalogoConId,
  descripcion: string,
  opciones: OpcionesSolicitud = {},
): Promise<void> {
  await page.goto('/app/cliente/solicitudes/nueva');
  await expect(page.getByRole('heading', { level: 1, name: 'Nueva solicitud' })).toBeVisible();

  await elegirOpcion(page, 'Tipo de equipo', catalogos.equipos[0].nombre);
  await elegirOpcion(page, 'Tipo de servicio', catalogos.servicios[0].nombre);
  await elegirOpcion(page, 'Distrito', distrito.nombre);
  await elegirOpcion(page, 'Urgencia', 'Urgencia media');
  if (opciones.modalidad !== undefined) {
    await elegirOpcion(page, 'Modalidad de atención', opciones.modalidad);
  }
  await page.getByLabel('Marca (opcional)').fill('Lenovo');
  await page.getByLabel('Modelo (opcional)').fill('ThinkPad E2E');
  await page.getByLabel('Descripción del problema').fill(descripcion);
  if (opciones.modalidad !== 'En taller') {
    await page.getByLabel('Dirección').fill('Av. Grau 123, Piura');
  }
  await page.getByLabel('Presupuesto referencial (opcional)').fill('180');
  await page.getByLabel('Seleccionar fotos del equipo').setInputFiles({
    name: 'equipo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  });
  await expect(page.locator('.solicitud-form__foto')).toHaveCount(1);

  await page.getByRole('button', { name: 'Publicar solicitud' }).click();
  await expect(page).toHaveURL(/\/app\/cliente\/solicitudes\/\d+$/);
  await expect(page.getByText(descripcion, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Ofertas recibidas' })).toBeVisible();
}

async function elegirOpcion(page: Page, etiqueta: string, opcion: string): Promise<void> {
  const combo = page.getByRole('combobox', { name: etiqueta });
  await combo.evaluate((elemento) =>
    elemento.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  const caja = await combo.boundingBox();
  if (caja === null) {
    throw new Error(`No se pudo ubicar el campo ${etiqueta}.`);
  }
  // El centro del select sin valor coincide con la etiqueta flotante; se pulsa junto a la flecha.
  await combo.click({ position: { x: caja.width - 18, y: caja.height / 2 } });
  const lista = page.getByRole('listbox', { name: etiqueta });
  await expect(lista).toBeVisible();
  await lista.getByRole('option', { name: new RegExp(`^${escaparRegex(opcion)}(?: ·|$)`) }).click();
  await expect(lista).toBeHidden();
}

async function enviarMensaje(page: Page, contenido: string): Promise<void> {
  const mensajes = page.locator('app-mensajes-servicio');
  await mensajes.getByLabel('Nuevo mensaje').fill(contenido);
  await mensajes.getByRole('button', { name: 'Enviar', exact: true }).click();
}

async function leerPin(page: Page): Promise<string> {
  const pin = page.locator('.detalle__pin');
  await expect(pin).toBeVisible();
  const etiqueta = await pin.getAttribute('aria-label');
  const coincidencia = /PIN de inicio: (\d{4})/.exec(etiqueta ?? '');
  if (coincidencia === null) {
    const digitos = (await pin.locator('span').allTextContents()).join('');
    if (!/^\d{4}$/.test(digitos)) {
      throw new Error(`No se pudo leer el PIN de inicio desde el servicio (${digitos}).`);
    }
    return digitos;
  }
  return coincidencia[1];
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extraerId(url: string, prefijo: string): string {
  const indice = url.indexOf(prefijo);
  const coincidencia = indice === -1 ? null : /^(\d+)$/.exec(url.slice(indice + prefijo.length));
  if (coincidencia === null) {
    throw new Error(`No se pudo extraer el identificador desde ${url}`);
  }
  return coincidencia[1];
}

async function auditar(page: Page, include?: string): Promise<void> {
  await esperarAnimaciones(page.locator('body'));
  // Las notificaciones son overlays transitorios que se desvanecen; su texto y estado se
  // comprueban por separado. Excluirlas evita falsos positivos de contraste durante la salida.
  const analizador = new AxeBuilder({ page })
    .exclude('.mat-mdc-snack-bar-container')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (include !== undefined) {
    analizador.include(include);
  }
  const resultado = await analizador.analyze();
  expect(resultado.violations).toEqual([]);
}

async function esperarAnimaciones(locator: Locator): Promise<void> {
  await locator.evaluate(async (elemento) => {
    const animaciones = elemento.getAnimations({ subtree: true });
    await Promise.all(animaciones.map((animacion) => animacion.finished.catch(() => undefined)));
  });
}
