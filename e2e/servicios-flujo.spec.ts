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
      ofreceDomicilio: true,
      ofreceTaller: false,
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
): Promise<void> {
  await page.goto('/app/cliente/solicitudes/nueva');
  await expect(page.getByRole('heading', { level: 1, name: 'Nueva solicitud' })).toBeVisible();

  await elegirOpcion(page, 'Tipo de equipo', catalogos.equipos[0].nombre);
  await elegirOpcion(page, 'Tipo de servicio', catalogos.servicios[0].nombre);
  await elegirOpcion(page, 'Distrito', distrito.nombre);
  await elegirOpcion(page, 'Urgencia', 'Urgencia media');
  await page.getByLabel('Marca (opcional)').fill('Lenovo');
  await page.getByLabel('Modelo (opcional)').fill('ThinkPad E2E');
  await page.getByLabel('Descripción del problema').fill(descripcion);
  await page.getByLabel('Dirección').fill('Av. Grau 123, Piura');
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
  const analizador = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
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
