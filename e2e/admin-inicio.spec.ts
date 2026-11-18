import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const RESUMEN = {
  totalSolicitudes: 124,
  solicitudesSinOfertas: 7,
  totalServicios: 58,
  serviciosPorEstado: {},
  ingresoTotalComisiones: 100,
  ingresoMesActual: 10,
  comisionesPendientes: 3,
  deudaComisionesPendiente: 30,
  pagosPorValidar: 4,
  tecnicosActivos: 18,
  calificacionPromedio: 4.5,
  totalResenas: 12,
  reclamosAbiertos: 2,
  resenasReportadas: 1,
  tecnicosMasActivos: [],
};

async function simularSesionAdmin(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('fixtech.access-token', 'token-e2e');
    sessionStorage.setItem('fixtech.refresh-token', 'refresh-e2e');
    sessionStorage.setItem('fixtech.expires-at', String(Date.now() + 3_600_000));
  });
  await page.route('**/api/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        id: 1,
        correo: 'admin@example.test',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        nombres: 'Juan',
        apellidos: 'Murillo',
        fotoUrl: null,
        tecnico: null,
      },
    }),
  );
}

test('panel admin: cifras de la API, navegación, accesibilidad y capturas', async ({ page }) => {
  await simularSesionAdmin(page);
  await page.route('**/api/admin/dashboard', (route) => route.fulfill({ json: RESUMEN }));
  await page.goto('/app/inicio');
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Juan' })).toBeVisible();
  const prioridades = page.getByRole('region', { name: 'Necesita tu atención' });
  await expect(prioridades.getByRole('link', { name: /Pagos por validar/ })).toContainText('4');
  await expect(prioridades.getByRole('link', { name: /Solicitudes sin ofertas/ })).toContainText(
    '7',
  );
  await expect(page.getByText('124 solicitudes registradas')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Gestionar FIXTECH' }).getByRole('link'),
  ).toHaveCount(9);

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `/tmp/opencode/fixtech-admin-inicio-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultado.violations).toEqual([]);
    await page
      .getByRole('region', { name: 'Gestionar FIXTECH' })
      .getByRole('link', { name: /Auditoría/ })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-admin-modulos-${width}.png`,
      animations: 'disabled',
    });
  }

  await prioridades.getByRole('link', { name: /Pagos por validar/ }).click();
  await expect(page).toHaveURL(/\/app\/admin\/comisiones/);
});

test('panel admin: informa el fallo y recupera los datos al reintentar', async ({ page }) => {
  await simularSesionAdmin(page);
  let fallar = true;
  await page.route('**/api/admin/dashboard', (route) =>
    fallar
      ? route.fulfill({ status: 503, json: { mensaje: 'Servicio temporalmente no disponible.' } })
      : route.fulfill({ json: RESUMEN }),
  );
  await page.goto('/app/inicio');
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los indicadores');
  await expect(
    page.getByRole('region', { name: 'Gestionar FIXTECH' }).getByRole('link'),
  ).toHaveCount(9);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.screenshot({
    path: '/tmp/opencode/fixtech-admin-error-360.png',
    animations: 'disabled',
  });
  fallar = false;
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('link', { name: /Pagos por validar/ })).toContainText('4');
});

test('panel admin: distingue ceros reales de datos sin cargar', async ({ page }) => {
  await simularSesionAdmin(page);
  await page.route('**/api/admin/dashboard', (route) =>
    route.fulfill({
      json: {
        ...RESUMEN,
        totalSolicitudes: 0,
        totalServicios: 0,
        tecnicosActivos: 0,
        pagosPorValidar: 0,
        solicitudesSinOfertas: 0,
        reclamosAbiertos: 0,
        resenasReportadas: 0,
      },
    }),
  );
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/app/inicio');
  await expect(page.getByText('No hay asuntos pendientes en estos indicadores.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Pagos por validar/ })).toContainText('0');
  await expect(
    page.getByRole('region', { name: 'Gestionar FIXTECH' }).getByRole('link'),
  ).toHaveCount(9);
});

test('panel admin: muestra el estado de carga sin cifras inventadas', async ({ page }) => {
  await simularSesionAdmin(page);
  const continuar = Promise.withResolvers<void>();
  await page.route('**/api/admin/dashboard', async (route) => {
    await continuar.promise;
    await route.fulfill({ json: RESUMEN });
  });
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/app/inicio');
  await expect(
    page.getByRole('status', { name: 'Cargando indicadores administrativos' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Pagos por validar/ })).toHaveCount(0);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-admin-cargando-360.png',
    animations: 'disabled',
  });
  continuar.resolve();
  await expect(page.getByRole('link', { name: /Pagos por validar/ })).toContainText('4');
});
