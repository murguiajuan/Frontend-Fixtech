import { expect, test } from '@playwright/test';

const ANCHOS = [360, 768, 1280];

test.describe('Regresión responsive', () => {
  for (const ancho of ANCHOS) {
    test(`el acceso no desborda horizontalmente a ${ancho}px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto('/login');

      await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();

      const desbordamiento = await page.evaluate(() => ({
        documento: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cuerpo: document.body.scrollWidth - document.body.clientWidth,
      }));

      expect(desbordamiento.documento).toBeLessThanOrEqual(1);
      expect(desbordamiento.cuerpo).toBeLessThanOrEqual(1);
    });
  }

  test('la página 404 no desborda horizontalmente en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/ruta-inexistente');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const desbordamiento = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desbordamiento).toBeLessThanOrEqual(1);
  });

  for (const ancho of ANCHOS) {
    test(`captura visual del acceso a ${ancho}px`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'Las capturas se generan en el proyecto de escritorio.');
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto('/login');
      await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      await expect(page).toHaveScreenshot(`login-${ancho}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
