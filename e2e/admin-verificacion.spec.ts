import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Locator } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8082/api';

interface CatalogoConId {
  readonly id: number;
}

interface TecnicoAdminApi {
  readonly correo: string;
  readonly estadoVerificacion: string;
}

test.describe('Verificación de técnicos', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('un administrador aprueba un técnico de prueba', async ({ page, request }, testInfo) => {
    const tecnico = await registrarTecnico(request, testInfo.workerIndex);

    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
    await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/app\/inicio/);
    if (testInfo.project.name === 'mobile-360') {
      await page.getByRole('button', { name: /Abrir o cerrar menú/ }).click();
    }
    await page.getByRole('link', { name: 'Técnicos', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/admin\/tecnicos/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Verificación de técnicos' }),
    ).toBeVisible();

    await page.getByLabel('Buscar técnico').fill(tecnico.correo);
    await page.getByRole('button', { name: 'Buscar' }).click();

    const tarjeta = page.locator('article.tecnico').filter({ hasText: tecnico.correo });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText('En revisión', { exact: true })).toBeVisible();

    const accesibilidad = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accesibilidad.violations).toEqual([]);

    await tarjeta.getByRole('button', { name: 'Verificar' }).click();

    const dialogo = page.getByRole('dialog', { name: 'Verificar técnico' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText(tecnico.correo)).toBeVisible();
    await esperarAnimaciones(dialogo);

    const accesibilidadDialogo = await new AxeBuilder({ page })
      .include('mat-dialog-container')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accesibilidadDialogo.violations).toEqual([]);

    await dialogo.getByRole('checkbox', { name: /Confirmo que revisé la información/ }).check();
    await dialogo.getByRole('button', { name: 'Aprobar técnico' }).click();

    await expect(page.getByText(/se actualizó\./)).toBeVisible();
    await expect(dialogo).toBeHidden();
    await expect(tarjeta.getByText('Aprobado', { exact: true })).toBeVisible();

    await expect.poll(async () => estadoVerificacion(request, tecnico.correo)).toBe('APROBADO');
  });
});

async function registrarTecnico(
  request: APIRequestContext,
  workerIndex: number,
): Promise<{ correo: string; dni: string }> {
  const especialidades = await request.get(`${API_URL}/catalogos/especialidades`);
  const distritos = await request.get(`${API_URL}/catalogos/distritos`);
  expect(especialidades.ok()).toBeTruthy();
  expect(distritos.ok()).toBeTruthy();

  const especialidadesJson = (await especialidades.json()) as CatalogoConId[];
  const distritosJson = (await distritos.json()) as CatalogoConId[];
  expect(especialidadesJson.length).toBeGreaterThan(0);
  expect(distritosJson.length).toBeGreaterThan(0);

  const sufijo = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  const correo = `e2e.tecnico.${sufijo}@fixtech.pe`;
  const dni = String((Date.now() + workerIndex) % 100_000_000).padStart(8, '0');
  const celular = `9${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;

  const registro = await request.post(`${API_URL}/auth/register/tecnico`, {
    data: {
      nombres: 'Técnico',
      apellidos: `E2E ${workerIndex}`,
      correo,
      celular,
      dni,
      password: 'Tecnico123!',
      aceptoTerminos: true,
      descripcion: 'Técnico creado por la prueba E2E de verificación.',
      aniosExperiencia: 3,
      ofreceDomicilio: true,
      ofreceTaller: false,
      especialidadIds: [especialidadesJson[0].id],
      distritoIds: [distritosJson[0].id],
    },
  });
  expect(registro.status()).toBe(201);

  return { correo, dni };
}

async function estadoVerificacion(
  request: APIRequestContext,
  correo: string,
): Promise<string | undefined> {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { correo: 'admin@fixtech.pe', password: 'Admin123!' },
  });
  expect(login.ok()).toBeTruthy();
  const sesion = (await login.json()) as { accessToken: string };

  const listado = await request.get(`${API_URL}/admin/tecnicos`, {
    params: { busqueda: correo },
    headers: { Authorization: `Bearer ${sesion.accessToken}` },
  });
  expect(listado.ok()).toBeTruthy();
  const tecnicos = (await listado.json()) as TecnicoAdminApi[];
  return tecnicos.find((tecnico) => tecnico.correo === correo)?.estadoVerificacion;
}

async function esperarAnimaciones(locator: Locator): Promise<void> {
  await locator.evaluate(async (elemento) => {
    const animaciones = elemento.getAnimations({ subtree: true });
    await Promise.all(animaciones.map((animacion) => animacion.finished.catch(() => undefined)));
  });
}
