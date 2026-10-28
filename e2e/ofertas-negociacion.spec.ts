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

// PNG de 1x1 píxel para adjuntarlo como foto de la solicitud.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test.describe('Ofertas y negociación', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('el técnico oferta y el cliente negocia hasta crear el servicio', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(90_000);

    const catalogos = await obtenerCatalogos(request);
    const distrito = catalogos.distritos[0];
    const tecnico = await registrarTecnico(request, distrito.id, testInfo.workerIndex);
    await aprobarTecnico(request, tecnico.correo);
    const cliente = await registrarCliente(request, testInfo.workerIndex);
    const descripcion = `Oferta E2E ${Date.now()}-${testInfo.workerIndex}: la laptop no enciende.`;

    await iniciarSesion(page, cliente);
    await publicarSolicitud(page, catalogos, distrito, descripcion);
    const solicitudId = extraerSolicitudId(page.url());

    await auditar(page);

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);

    await page.goto('/app/tecnico/solicitudes');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Solicitudes disponibles' }),
    ).toBeVisible();
    const tarjeta = page.locator('article.disponible').filter({ hasText: descripcion });
    await expect(tarjeta).toBeVisible();
    await auditar(page);

    await tarjeta.getByRole('link', { name: /Ver detalle y ofertar/ }).click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}$`));
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      catalogos.equipos[0].nombre,
    );
    await expect(page.getByText(descripcion, { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Enviar oferta' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}/ofertar$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Enviar oferta' })).toBeVisible();
    await auditar(page);

    await page.getByLabel('Precio del servicio').fill('150');
    await page.getByLabel('Tiempo estimado (horas)').fill('3');
    await page.getByLabel('Costo de movilidad').fill('0');
    await page.getByLabel('Costo de diagnóstico').fill('20');
    await page.getByRole('button', { name: 'Enviar oferta' }).click();

    await expect(page).toHaveURL(new RegExp(`/app/tecnico/solicitudes/${solicitudId}$`));
    await expect(page.getByText('Tu oferta', { exact: true })).toBeVisible();
    await expect(page.getByText('S/ 150.00').first()).toBeVisible();
    await expect(page.getByText('Enviada', { exact: true }).first()).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/solicitudes/${solicitudId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Ofertas recibidas' })).toBeVisible();
    await expect(page.getByText('María Quispe')).toBeVisible();
    await auditar(page);

    await page.getByRole('button', { name: 'Hacer contraoferta' }).click();
    const dialogoContraoferta = page.getByRole('dialog');
    await expect(dialogoContraoferta).toBeVisible();
    await esperarAnimaciones(dialogoContraoferta);
    await dialogoContraoferta.getByLabel('Monto propuesto por el servicio').fill('140');
    await dialogoContraoferta
      .getByLabel('Mensaje (opcional)')
      .fill('Puedo pagar 140 soles por el servicio.');
    await auditar(page, 'mat-dialog-container');
    await dialogoContraoferta.getByRole('button', { name: 'Enviar contraoferta' }).click();

    await expect(dialogoContraoferta).toBeHidden();
    await expect(
      page.getByText('Tu contraoferta está pendiente de respuesta del técnico.'),
    ).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto('/app/tecnico/ofertas');
    await expect(page.getByRole('heading', { level: 1, name: 'Mis ofertas' })).toBeVisible();

    const oferta = page.locator('article.oferta').filter({ hasText: `Solicitud #${solicitudId}` });
    await expect(oferta).toBeVisible();
    await expect(oferta.getByText('Contraoferta del cliente · ronda 1')).toBeVisible();
    await auditar(page);

    await oferta.getByRole('button', { name: 'Responder contraoferta' }).click();
    const dialogoTecnico = page.getByRole('dialog');
    await expect(dialogoTecnico).toBeVisible();
    await esperarAnimaciones(dialogoTecnico);
    await dialogoTecnico.getByLabel('Monto propuesto por el servicio').fill('145');
    await dialogoTecnico
      .getByLabel('Mensaje (opcional)')
      .fill('Puedo dejarlo en 145 soles, incluyendo la revisión.');
    await dialogoTecnico.getByRole('button', { name: 'Enviar contraoferta' }).click();

    await expect(dialogoTecnico).toBeHidden();
    await expect(
      oferta.getByText('Esperando la respuesta del cliente a tu contraoferta.'),
    ).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, cliente);
    await page.goto(`/app/cliente/solicitudes/${solicitudId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Ofertas recibidas' })).toBeVisible();

    await page.getByRole('button', { name: 'Responder contraoferta' }).click();
    const dialogoAceptar = page.getByRole('dialog');
    await expect(dialogoAceptar).toBeVisible();
    await esperarAnimaciones(dialogoAceptar);
    await dialogoAceptar.getByRole('radio', { name: 'Aceptar la contraoferta' }).check();
    await dialogoAceptar
      .getByRole('checkbox', { name: /Confirmo que deseo aceptar esta contraoferta/ })
      .check();
    await auditar(page, 'mat-dialog-container');
    await dialogoAceptar.getByRole('button', { name: 'Aceptar contraoferta' }).click();

    await expect(dialogoAceptar).toBeHidden();
    await expect(page.getByText('El servicio ya fue confirmado.')).toBeVisible();
    await expect(page.getByText(/Referencia del servicio: #\d+/)).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, tecnico);
    await page.goto('/app/tecnico/ofertas');
    const ofertaAceptada = page
      .locator('article.oferta')
      .filter({ hasText: `Solicitud #${solicitudId}` });
    await expect(ofertaAceptada).toBeVisible();
    await expect(ofertaAceptada.getByText('Aceptada', { exact: true }).first()).toBeVisible();
    await expect(ofertaAceptada.getByText('El cliente aceptó esta oferta.').first()).toBeVisible();
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
  const correo = `e2e.ofertas.tecnico.${sufijo}@fixtech.pe`;
  const dni = String((Date.now() + workerIndex) % 100_000_000).padStart(8, '0');
  const celular = `9${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;

  const registro = await request.post(`${API_URL}/auth/register/tecnico`, {
    data: {
      nombres: 'María',
      apellidos: `Quispe ${workerIndex}`,
      correo,
      celular,
      dni,
      password: 'Tecnico123!',
      aceptoTerminos: true,
      descripcion: 'Técnico creado por la prueba E2E de ofertas.',
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
  const correo = `e2e.ofertas.cliente.${sufijo}@fixtech.pe`;
  const dni = String((Date.now() + workerIndex + 1) % 100_000_000).padStart(8, '0');
  const celular = `9${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
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

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extraerSolicitudId(url: string): string {
  const coincidencia = /\/app\/cliente\/solicitudes\/(\d+)$/.exec(url);
  if (coincidencia === null) {
    throw new Error(`No se pudo extraer el identificador de la solicitud desde ${url}`);
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
