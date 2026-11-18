import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const ABIERTO = {
  id: 51,
  servicioId: 21,
  clienteId: 2,
  clienteNombre: 'Lucía Ramos',
  descripcion: 'El equipo regresó con la misma falla al día siguiente.',
  estado: 'ABIERTO',
  respuestaTecnico: 'Estoy revisando el caso.',
  resolucion: null,
  resueltoPorId: null,
  creadoEn: '2026-10-27T17:00:00',
  fechaResolucion: null,
  fotoIds: [],
};
const CERRADO = {
  ...ABIERTO,
  id: 52,
  clienteNombre: 'Pedro Silva',
  estado: 'CERRADO',
  resolucion: 'Se reemplazó el repuesto.',
  fechaResolucion: '2026-10-30T17:00:00',
};
const REVISION = { ...ABIERTO, id: 53, estado: 'EN_REVISION' };
const COMISION = {
  id: 101,
  servicioId: 21,
  montoBase: 180,
  porcentaje: 0.06,
  montoComision: 10.8,
  montoNetoTecnico: 169.2,
  estado: 'PENDIENTE',
  fechaLimitePago: '2026-11-03',
  fechaPago: null,
  creadoEn: '2026-10-27T12:00:00',
};
const PAGO = {
  id: 51,
  tecnicoId: 9,
  tecnicoNombre: 'María Quispe',
  tecnicoCorreo: 'maria@example.test',
  monto: 10.8,
  metodo: 'YAPE',
  numeroOperacion: 'OP-2026-001',
  estado: 'PENDIENTE',
  observacion: null,
  fechaValidacion: null,
  creadoEn: '2026-10-27T13:00:00',
  tieneComprobante: false,
  comisiones: [COMISION],
};
const VALIDADO = { ...PAGO, id: 52, estado: 'VALIDADO', fechaValidacion: '2026-10-28T12:00:00' };
const DEUDOR = {
  tecnicoId: 9,
  tecnicoNombre: 'María Quispe',
  correo: 'maria@example.test',
  saldoPendiente: 10.8,
  limiteDeuda: 30,
  bloqueadoPorDeuda: true,
  comisionesPendientes: 1,
  comisionesVencidas: 1,
  proximoVencimiento: '2026-11-03',
};

async function iniciarSesion(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
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

async function revisarAnchos(page: Page, prefijo: string, objetivo: Locator): Promise<void> {
  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    await page.evaluate(() => document.fonts.ready);
    await objetivo.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-${prefijo}-${width}.png`,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultado.violations).toEqual([]);
  }
}

async function revisarPantalla(page: Page, prefijo: string, titulo: string): Promise<void> {
  await revisarAnchos(page, prefijo, page.getByRole('heading', { name: titulo, exact: true }));
}

test('reclamos: prioridad, detalle, filtro y confirmación sin modificar datos', async ({
  page,
}) => {
  await iniciarSesion(page);
  await page.route('**/api/admin/reclamos/*/estado', (route) =>
    route.fulfill({ status: 409, json: { mensaje: 'El reclamo ya cambió de estado.' } }),
  );
  await page.route('**/api/admin/reclamos/*', (route) =>
    route.fulfill({
      json: [ABIERTO, CERRADO, REVISION].find((r) => route.request().url().endsWith(`/${r.id}`)),
    }),
  );
  await page.route('**/api/admin/reclamos*', (route) => {
    const estado = new URL(route.request().url()).searchParams.get('estado');
    return route.fulfill({
      json: [CERRADO, ABIERTO, REVISION].filter((r) => estado === null || r.estado === estado),
    });
  });
  await page.goto('/app/admin/reclamos');
  const fichas = page.locator('.reclamo');
  await expect(fichas.first()).toContainText('Reclamo #51');
  await expect(page.getByText('2 por atender en este listado')).toBeVisible();
  await revisarPantalla(page, 'reclamos', 'Reclamos');
  await fichas.first().getByRole('button', { name: 'Ver detalle' }).click();
  await expect(fichas.first().getByText('Estoy revisando el caso.')).toBeVisible();
  await fichas.first().getByRole('button', { name: 'Iniciar revisión' }).click();
  await expect(page.getByRole('dialog')).toContainText('Revisa la evidencia');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-reclamos-dialogo-360.png',
    animations: 'disabled',
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Volver' }).click();
  await expect(fichas.first().getByRole('button', { name: 'Iniciar revisión' })).toBeVisible();
  await fichas.nth(1).getByRole('button', { name: 'Ver detalle' }).click();
  await expect(fichas.nth(1).getByRole('button', { name: 'Resolver reclamo' })).toBeVisible();
  await fichas.nth(1).getByRole('button', { name: 'Resolver reclamo' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Resolver reclamo' });
  await dialogo.getByRole('textbox', { name: 'Resolución del reclamo' }).fill('   ');
  await dialogo.getByRole('button', { name: 'Resolver reclamo' }).click();
  await expect(dialogo.getByText('La resolución es obligatoria.')).toBeVisible();
  await page.waitForTimeout(150);
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
  await dialogo.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('combobox', { name: 'Estado del reclamo' }).click();
  await page.getByRole('option', { name: 'Cerrado' }).click();
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(fichas).toHaveCount(1);
  await expect(page.getByText('2 por atender en este listado')).toHaveCount(0);
  await fichas.first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-reclamos-fichas-360.png',
    animations: 'disabled',
  });
  await page.getByRole('combobox', { name: 'Estado del reclamo' }).click();
  await page.getByRole('option', { name: 'Resuelto' }).click();
  await page.getByRole('button', { name: 'Filtrar' }).click();
  const vacio = page.getByRole('heading', { name: 'No encontramos reclamos' });
  await expect(vacio).toBeVisible();
  await revisarAnchos(page, 'reclamos-vacio', vacio);
});

test('reclamos: carga y error de detalle con reintento local', async ({ page }) => {
  await iniciarSesion(page);
  const continuar = Promise.withResolvers<void>();
  await page.route('**/api/admin/reclamos*', async (route) => {
    await continuar.promise;
    await route.fulfill({ json: [ABIERTO] });
  });
  let fallar = true;
  await page.route('**/api/admin/reclamos/*', (route) =>
    route.fulfill(
      fallar ? { status: 503, json: { mensaje: 'Detalle no disponible.' } } : { json: ABIERTO },
    ),
  );
  await page.goto('/app/admin/reclamos');
  await expect(page.getByRole('progressbar', { name: 'Cargando reclamos' })).toBeVisible();
  await expect(page.locator('.reclamo')).toHaveCount(0);
  continuar.resolve();
  await page.locator('.reclamo').getByRole('button', { name: 'Ver detalle' }).click();
  await expect(page.getByRole('alert')).toContainText('Detalle no disponible.');
  fallar = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Estoy revisando el caso.')).toBeVisible();
});

test('pagos: prioriza pendientes y separa deudores con métricas reales', async ({ page }) => {
  await iniciarSesion(page);
  await page.route('**/api/admin/pagos/*/validacion', (route) =>
    route.fulfill({ status: 409, json: { mensaje: 'El pago ya fue procesado.' } }),
  );
  await page.route('**/api/admin/pagos*', (route) => {
    const estado = new URL(route.request().url()).searchParams.get('estado');
    return route.fulfill({
      json: [VALIDADO, PAGO].filter((p) => estado === null || p.estado === estado),
    });
  });
  await page.route('**/api/admin/comisiones/deudores', (route) =>
    route.fulfill({ json: [DEUDOR] }),
  );
  await page.goto('/app/admin/comisiones');
  const fichas = page.locator('.pago');
  await expect(fichas.first()).toContainText('Pago #51');
  await expect(page.getByText('1 por validar en este listado')).toBeVisible();
  await revisarPantalla(page, 'pagos', 'Comisiones y pagos');
  await fichas
    .first()
    .getByRole('button', { name: /Ver comisiones/ })
    .click();
  await expect(fichas.first().getByText('Servicio #21')).toBeVisible();
  await fichas.first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-pagos-fichas-360.png',
    animations: 'disabled',
  });
  await fichas.first().getByRole('button', { name: 'Rechazar pago' }).click();
  const dialogo = page.getByRole('dialog', { name: /Rechazar pago/ });
  await dialogo.getByRole('button', { name: 'Rechazar pago' }).click();
  const error = dialogo.getByText('El motivo es obligatorio para rechazar el pago.');
  await expect(error).toBeVisible();
  await expect(dialogo.getByText('Debes marcar la confirmación para continuar.')).toBeVisible();
  const errorBox = await error.boundingBox();
  const checkboxBox = await dialogo.getByRole('checkbox').boundingBox();
  if (errorBox === null || checkboxBox === null) {
    throw new Error('No se pudo medir el espacio del formulario.');
  }
  expect(checkboxBox.y).toBeGreaterThan(errorBox.y + errorBox.height);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-pagos-dialogo-360.png',
    animations: 'disabled',
  });
  const axeDialogo = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(axeDialogo.violations).toEqual([]);
  await dialogo
    .getByRole('textbox', { name: 'Motivo del rechazo' })
    .fill('Operación no registrada.');
  await dialogo.getByRole('checkbox').check();
  await dialogo.getByRole('button', { name: 'Rechazar pago' }).click();
  await expect(dialogo.getByRole('alert')).toContainText('El pago ya fue procesado.');
  await dialogo.getByRole('button', { name: 'Cancelar' }).click();

  await page.getByRole('tab', { name: /Deudores/ }).click();
  await expect(page.getByRole('region', { name: 'Resumen de deudores' })).toContainText('10.80');
  await expect(page.locator('.deudor')).toContainText('María Quispe');
  await revisarAnchos(page, 'deudores', page.getByRole('tab', { name: /Deudores/ }));
});

test('deudores: error no se presenta como deuda cero y permite reintentar', async ({ page }) => {
  await iniciarSesion(page);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.route('**/api/admin/pagos*', (route) => route.fulfill({ json: [] }));
  let fallar = true;
  await page.route('**/api/admin/comisiones/deudores', (route) =>
    route.fulfill(
      fallar ? { status: 503, json: { mensaje: 'No hay datos disponibles.' } } : { json: [] },
    ),
  );
  await page.goto('/app/admin/comisiones');
  await expect(page.getByRole('heading', { name: 'Aún no hay pagos registrados' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-pagos-vacio-360.png',
    animations: 'disabled',
  });
  await page.getByRole('tab', { name: 'Deudores' }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los deudores');
  await expect(page.getByRole('region', { name: 'Resumen de deudores' })).toHaveCount(0);
  await revisarAnchos(page, 'deudores-error', page.getByRole('alert'));
  fallar = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  const vacio = page.getByRole('heading', { name: 'No hay técnicos con deuda pendiente' });
  await expect(vacio).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resumen de deudores' })).toBeVisible();
  await revisarAnchos(page, 'deudores-vacio', vacio);
});
