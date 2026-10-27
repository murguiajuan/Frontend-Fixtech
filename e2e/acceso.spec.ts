import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Acceso público', () => {
  test('el login es visible y no presenta violaciones de accesibilidad', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();

    const accesibilidad = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accesibilidad.violations).toEqual([]);
  });

  test('el registro valida los campos obligatorios', async ({ page }) => {
    await page.goto('/registro');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Registro de cliente' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('Ingresa tus nombres.')).toBeVisible();
    await expect(page.getByText('Ingresa tus apellidos.')).toBeVisible();
    await expect(page.getByText('Ingresa tu correo electrónico.')).toBeVisible();
  });

  test('la ruta desconocida muestra la página 404', async ({ page }) => {
    await page.goto('/ruta-inexistente');

    await expect(
      page.getByRole('heading', { level: 1, name: 'La ruta que buscas no existe' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Ir a FIXTECH/i })).toBeVisible();
  });
});
