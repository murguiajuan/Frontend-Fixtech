import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Módulos administrativos', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('carga parámetros, reportes y auditoría sin errores', async ({ page }) => {
    await iniciarSesionAdministrador(page);

    await page.goto('/app/admin/parametros');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Parámetros del sistema' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comisión de FIXTECH' })).toBeVisible();
    await expect(page.getByText('No pudimos cargar los parámetros')).toHaveCount(0);
    await verificarAccesibilidad(page);

    await page.goto('/app/admin/reportes');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Reportes e indicadores' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resumen operativo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resultado del periodo' })).toBeVisible();
    await expect(page.getByText('No pudimos cargar los indicadores')).toHaveCount(0);
    await expect(page.getByText('No pudimos generar el reporte')).toHaveCount(0);
    await verificarAccesibilidad(page);

    await page.goto('/app/admin/auditoria');
    await expect(page.getByRole('heading', { level: 1, name: 'Auditoría' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Registros de auditoría' })).toBeVisible();
    await expect(page.getByText('No pudimos cargar la auditoría')).toHaveCount(0);
    await verificarAccesibilidad(page);
  });
});

async function iniciarSesionAdministrador(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);
}

async function verificarAccesibilidad(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
}
