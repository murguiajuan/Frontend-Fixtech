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

interface ClientePrueba {
  readonly correo: string;
  readonly password: string;
}

// PNG de 1x1 píxel para adjuntarlo como foto de la solicitud.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test.describe('Solicitudes del cliente', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('el cliente publica, edita, consulta y cancela una solicitud con foto', async ({
    page,
    request,
  }, testInfo) => {
    const catalogos = await obtenerCatalogos(request);
    const cliente = await registrarCliente(request, testInfo.workerIndex);
    const descripcion = `Solicitud E2E ${Date.now()}-${testInfo.workerIndex}: la laptop no enciende.`;
    const descripcionEditada = `${descripcion} Actualizada desde la edición.`;
    const motivo = 'Se resolvió la falla por otro medio durante la prueba E2E.';

    await iniciarSesion(page, cliente);

    await page.getByRole('link', { name: 'Nueva solicitud', exact: true }).first().click();
    await expect(page).toHaveURL(/\/app\/cliente\/solicitudes\/nueva/);
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva solicitud' })).toBeVisible();

    await elegirOpcion(page, 'Tipo de equipo', catalogos.equipos[0].nombre);
    await elegirOpcion(page, 'Tipo de servicio', catalogos.servicios[0].nombre);
    await elegirOpcion(page, 'Distrito', catalogos.distritos[0].nombre);
    await elegirOpcion(page, 'Urgencia', 'Urgencia alta');
    await page.getByLabel('Marca (opcional)').fill('Lenovo');
    await page.getByLabel('Modelo (opcional)').fill('ThinkPad E2E');
    await page.getByLabel('Descripción del problema').fill(descripcion);
    await page.getByLabel('Dirección').fill('Av. Grau 123, Piura');
    await page.getByLabel('Referencia (opcional)').fill('Frente al mercado');
    await page.getByLabel('Presupuesto referencial (opcional)').fill('180');

    await page.getByLabel('Seleccionar fotos del equipo').setInputFiles({
      name: 'equipo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });
    await expect(page.locator('.solicitud-form__foto')).toHaveCount(1);

    await auditar(page);

    await page.getByRole('button', { name: 'Publicar solicitud' }).click();

    await expect(page).toHaveURL(/\/app\/cliente\/solicitudes\/\d+$/);
    const urlDetalle = page.url();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      catalogos.equipos[0].nombre,
    );
    await expect(page.getByText('Publicada', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(descripcion, { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Foto 1 de la solicitud' })).toBeVisible();

    await auditar(page);

    await page.getByRole('link', { name: 'Editar solicitud' }).first().click();
    await expect(page).toHaveURL(`${urlDetalle}/editar`);
    await expect(page.getByRole('heading', { level: 1, name: 'Editar solicitud' })).toBeVisible();
    await page.getByLabel('Descripción del problema').fill(descripcionEditada);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(urlDetalle);
    await expect(page.getByText(descripcionEditada, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar solicitud' }).first().click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText(/Cancelar solicitud #\d+/)).toBeVisible();
    await dialogo.getByLabel('Motivo de cancelación (opcional)').fill(motivo);
    await auditar(page, 'mat-dialog-container');
    await dialogo.getByRole('button', { name: 'Sí, cancelar solicitud' }).click();

    await expect(page.getByText('Esta solicitud fue cancelada.')).toBeVisible();
    await expect(page.getByText(`Motivo: ${motivo}`)).toBeVisible();
    await expect(page.getByText('Cancelada', { exact: true }).first()).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    if (await nav.isVisible()) {
      await nav.getByRole('link', { name: 'Mis solicitudes', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Abrir o cerrar menú de navegación' }).click();
      await nav.getByRole('link', { name: 'Mis solicitudes', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/app\/cliente\/solicitudes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Mis solicitudes' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancelada', exact: true }).click();
    await expect(page.getByText(descripcionEditada, { exact: true })).toBeVisible();
    await expect(page.getByText('Cancelada', { exact: true }).first()).toBeVisible();

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

async function registrarCliente(
  request: APIRequestContext,
  workerIndex: number,
): Promise<ClientePrueba> {
  const sufijo = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  const correo = `e2e.solicitudes.${sufijo}@fixtech.pe`;
  const dni = String((Date.now() + workerIndex) % 100_000_000).padStart(8, '0');
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

async function iniciarSesion(page: Page, cliente: ClientePrueba): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(cliente.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(cliente.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola');
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
