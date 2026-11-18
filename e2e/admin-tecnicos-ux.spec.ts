import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const APROBADA = {
  id: 10,
  usuarioId: 20,
  correo: 'beatriz@example.test',
  nombres: 'Beatriz',
  apellidos: 'López',
  dni: '12345678',
  celular: '987654321',
  fotoUrl: null,
  estadoVerificacion: 'APROBADO',
  motivoVerificacion: null,
  bloqueadoPorDeuda: false,
  saldoComisionPendiente: 0,
  modalidades: ['DOMICILIO'],
  calificacionPromedio: 4.8,
  totalResenas: 8,
  serviciosCompletados: 12,
  destacado: false,
  fechaVerificacion: '2026-11-10T10:00:00',
  creadoEn: '2026-11-01T10:00:00',
};

const PENDIENTE = {
  ...APROBADA,
  id: 11,
  usuarioId: 21,
  correo: 'ana@example.test',
  nombres: 'Ana',
  apellidos: 'Torres',
  estadoVerificacion: 'PENDIENTE',
  fechaVerificacion: null,
  modalidades: ['DOMICILIO', 'TALLER'],
  serviciosCompletados: 0,
  totalResenas: 0,
  calificacionPromedio: 0,
};

async function iniciarPagina(page: Page): Promise<void> {
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
  await page.route('**/api/admin/tecnicos/**', (route) =>
    route.fulfill({ status: 409, json: { mensaje: 'La decisión ya fue registrada.' } }),
  );
  await page.route('**/api/admin/tecnicos*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const estado = params.get('estadoVerificacion');
    const busqueda = params.get('busqueda')?.toLowerCase();
    const tecnicos = [APROBADA, PENDIENTE].filter(
      (tecnico) =>
        (estado === null || tecnico.estadoVerificacion === estado) &&
        (busqueda === undefined ||
          `${tecnico.nombres} ${tecnico.apellidos} ${tecnico.correo}`
            .toLowerCase()
            .includes(busqueda)),
    );
    return route.fulfill({ json: tecnicos });
  });
  await page.goto('/app/admin/tecnicos');
}

test('lista pendientes primero; filtros, detalle y capturas responden en todos los tamaños', async ({
  page,
}) => {
  await iniciarPagina(page);
  await expect(page.getByText('1 pendiente en este listado')).toBeVisible();
  const fichas = page.locator('.tecnico');
  await expect(fichas.first()).toContainText('Ana Torres');

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `/tmp/opencode/fixtech-tecnicos-${width}.png`,
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

  await fichas.first().getByRole('button', { name: 'Ver detalle' }).click();
  await expect(fichas.first().getByText('En taller')).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-tecnicos-detalle-360.png',
    animations: 'disabled',
  });
  await page.getByLabel('Buscar técnico').fill('Beatriz');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(fichas).toHaveCount(1);
  await expect(fichas.first()).toContainText('Beatriz López');
  await expect(page.getByText('1 pendiente en este listado')).toHaveCount(0);
  await fichas.first().getByRole('button', { name: 'Actualizar estado' }).click();
  await expect(page.getByText('Este ya es el estado del técnico.')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Aprobar técnico' }),
  ).toBeDisabled();
});

test('diálogo móvil pide motivo y confirmación antes de intentar rechazar', async ({ page }) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.locator('.tecnico').first().getByRole('button', { name: 'Verificar' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toContainText('Ana Torres');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-verificacion-dialog-inicial-360.png',
    animations: 'disabled',
  });
  await dialogo.getByRole('radio', { name: /Rechazar perfil/ }).check();
  await dialogo.getByRole('button', { name: 'Rechazar técnico' }).click();
  await expect(
    dialogo.getByText('El motivo es obligatorio para observar o rechazar al técnico.'),
  ).toBeVisible();
  await expect(dialogo.getByText('Debes marcar la confirmación para continuar.')).toBeVisible();
  const errorMotivo = await dialogo
    .getByText('El motivo es obligatorio para observar o rechazar al técnico.')
    .boundingBox();
  const confirmacion = await dialogo.getByRole('checkbox').boundingBox();
  if (errorMotivo === null || confirmacion === null) {
    throw new Error('No se pudo medir la separación entre el error y la confirmación.');
  }
  expect(confirmacion.y).toBeGreaterThan(errorMotivo.y + errorMotivo.height);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-verificacion-dialog-360.png',
    animations: 'disabled',
  });
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
  await dialogo.getByLabel('Motivo del rechazo').fill('Falta información del perfil.');
  await dialogo.getByRole('checkbox').check();
  await dialogo.getByRole('button', { name: 'Rechazar técnico' }).click();
  await expect(dialogo.getByRole('alert')).toContainText('La decisión ya fue registrada.');
});

test('el listado conserva la lectura con datos largos, vacío y error', async ({ page }) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 800 });
  let estado: 'largo' | 'vacio' | 'error' = 'largo';
  await page.route('**/api/admin/tecnicos*', (route) => {
    if (estado === 'error') {
      return route.fulfill({ status: 503, json: { mensaje: 'Inténtalo nuevamente.' } });
    }
    return route.fulfill({
      json:
        estado === 'vacio'
          ? []
          : [
              {
                ...PENDIENTE,
                nombres: 'Ana María de los Ángeles Guadalupe',
                correo: `${'contacto.'.repeat(9)}@example.test`,
              },
            ],
    });
  });

  await page.reload();
  await expect(page.locator('.tecnico__identidad h2')).toContainText('Ana María');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-tecnicos-largo-360.png',
    animations: 'disabled',
  });

  estado = 'vacio';
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Aún no hay técnicos' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-tecnicos-vacio-360.png',
    animations: 'disabled',
  });

  estado = 'error';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los técnicos');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-tecnicos-error-360.png',
    animations: 'disabled',
  });
  estado = 'vacio';
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Aún no hay técnicos' })).toBeVisible();
});

test('muestra carga sin fichas ficticias y luego los datos recibidos', async ({ page }) => {
  await iniciarPagina(page);
  const continuar = Promise.withResolvers<void>();
  await page.route('**/api/admin/tecnicos*', async (route) => {
    await continuar.promise;
    await route.fulfill({ json: [PENDIENTE] });
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  await expect(page.getByRole('progressbar', { name: 'Cargando técnicos' })).toBeVisible();
  await expect(page.locator('.tecnico')).toHaveCount(0);
  continuar.resolve();
  await expect(page.locator('.tecnico')).toHaveCount(1);
  await expect(page.getByText('1 pendiente en este listado')).toBeVisible();
});
