import { expect, test } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Inicio de sesión real', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('el administrador inicia sesión y llega al panel', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
    await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/app\/inicio/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola');
    await expect(page.getByText('Cuenta activa')).toBeVisible();
  });
});
