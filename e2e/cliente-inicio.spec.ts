import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('inicio del cliente muestra datos reales y acciones accesibles', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('fixtech.access-token', 'token-e2e');
    sessionStorage.setItem('fixtech.refresh-token', 'refresh-e2e');
    sessionStorage.setItem('fixtech.expires-at', String(Date.now() + 3_600_000));
  });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        id: 1,
        correo: 'ana@example.test',
        rol: 'CLIENTE',
        estado: 'ACTIVO',
        nombres: 'Ana María',
        apellidos: 'López',
        fotoUrl: null,
        tecnico: null,
      },
    }),
  );
  await page.route('**/api/solicitudes/mias', (route) =>
    route.fulfill({
      json: [
        {
          id: 3,
          estado: 'CON_OFERTAS',
          urgencia: 'MEDIA',
          modalidad: 'DOMICILIO',
          tipoEquipo: 'Laptop',
          tipoServicio: 'Reparación',
          distrito: 'Piura',
          marca: null,
          modelo: null,
          descripcion: 'Pantalla',
          presupuestoReferencial: null,
          fechaVencimiento: '2026-11-12T12:00:00',
          creadoEn: '2026-11-04T12:00:00',
          imagenPrincipalUrl: null,
        },
      ],
    }),
  );
  await page.route('**/api/servicios/mios', (route) =>
    route.fulfill({
      json: [
        {
          id: 8,
          solicitudId: 3,
          modalidad: 'DOMICILIO',
          estado: 'EN_PROCESO',
          montoTotal: 120,
          montoFinal: null,
          contraparteId: 4,
          contraparteNombre: 'Técnico',
          tipoEquipo: 'Laptop',
          tipoServicio: 'Reparación',
          fechaProgramada: null,
          fechaFinalizacion: null,
          creadoEn: '2026-11-04T12:00:00',
        },
      ],
    }),
  );

  await page.goto('/app/inicio');
  await expect(page.getByRole('heading', { level: 1, name: /Hola, Ana/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Solicitar un servicio/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Reparación · Laptop/ })).toHaveCount(2);
  await expect(page.getByText('Solicitudes con ofertas')).toBeVisible();
  await expect(page.getByText('No pudimos cargar tus solicitudes')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `/tmp/opencode/cliente-inicio-${test.info().project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
