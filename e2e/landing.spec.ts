import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing: búsqueda, carrusel, navegación y accesibilidad', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (error) => errores.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errores.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu Solución Técnica');
  await expect(page.locator('.servicio')).toHaveCount(6);
  await page.getByRole('searchbox').fill('pantalla');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('.servicio')).toHaveCount(1);
  await expect(page.locator('.servicio')).toContainText('Reparación de Hardware');
  await page.getByRole('searchbox').fill('sin coincidencias');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('No encontramos ese servicio.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos los servicios' }).click();
  await expect(page.locator('.servicio')).toHaveCount(6);
  await page.getByRole('button', { name: 'Reseña siguiente' }).click();
  await expect(page.locator('.resena')).toContainText('Diego R.');
  await page.getByRole('button', { name: 'Reseña anterior' }).click();
  await expect(page.locator('.resena')).toContainText('Carlos M.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.tecnico').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.locator('.tecnico img').evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(errores).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const menu = page.getByRole('button', { name: 'Abrir o cerrar menú' });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Servicios', exact: true })
      .click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
  await page.locator('.servicio').first().click();
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
});
