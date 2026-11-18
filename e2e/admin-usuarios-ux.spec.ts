import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ADMIN = {
  id: 1,
  correo: 'admin@example.test',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  nombres: 'Juan',
  apellidos: 'Murillo',
  motivoSuspension: null,
  creadoEn: '2026-11-01T09:00:00',
};

const CLIENTE = {
  ...ADMIN,
  id: 2,
  correo: 'lucia@example.test',
  nombres: 'Lucía',
  apellidos: 'Ramos',
  rol: 'CLIENTE',
};

const SUSPENDIDO = {
  ...ADMIN,
  id: 3,
  correo: 'tecnico@example.test',
  nombres: 'Pedro',
  apellidos: 'Silva',
  rol: 'TECNICO',
  estado: 'SUSPENDIDO',
  motivoSuspension: 'Incumplimiento de las normas de uso.',
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
        correo: ADMIN.correo,
        rol: 'ADMIN',
        estado: 'ACTIVO',
        nombres: 'Juan',
        apellidos: 'Murillo',
        fotoUrl: null,
        tecnico: null,
      },
    }),
  );
  await page.route('**/api/admin/usuarios/*/estado', (route) =>
    route.fulfill({ status: 409, json: { mensaje: 'El estado de la cuenta ya cambió.' } }),
  );
  await page.route('**/api/admin/usuarios*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const rol = params.get('rol');
    const estado = params.get('estado');
    const busqueda = params.get('busqueda')?.toLowerCase();
    const usuarios = [ADMIN, CLIENTE, SUSPENDIDO].filter(
      (usuario) =>
        (rol === null || usuario.rol === rol) &&
        (estado === null || usuario.estado === estado) &&
        (busqueda === undefined ||
          `${usuario.nombres} ${usuario.apellidos} ${usuario.correo}`
            .toLowerCase()
            .includes(busqueda)),
    );
    return route.fulfill({ json: usuarios });
  });
  await page.goto('/app/admin/usuarios');
}

test('cuentas protegidas, filtros y capturas accesibles con datos simulados', async ({ page }) => {
  await iniciarPagina(page);
  const cuentas = page.locator('.usuario');
  await expect(cuentas).toHaveCount(3);
  await expect(page.getByText('1 cuenta suspendida en este listado')).toBeVisible();
  await expect(cuentas.first()).toContainText('Tu cuenta está protegida');
  await expect(cuentas.first().getByRole('button', { name: 'Suspender' })).toHaveCount(0);
  await expect(cuentas.nth(1).getByRole('button', { name: 'Suspender' })).toBeVisible();
  await expect(cuentas.nth(2).getByRole('button', { name: 'Reactivar' })).toBeVisible();

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('heading', { name: 'Usuarios y accesos' }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-usuarios-${width}.png`,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultado.violations).toEqual([]);
    await cuentas.last().getByRole('button', { name: 'Reactivar' }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-usuarios-fichas-${width}.png`,
      animations: 'disabled',
    });
  }

  await page.getByRole('searchbox', { name: 'Buscar usuario' }).fill('Lucía');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(cuentas).toHaveCount(1);
  await expect(cuentas.first()).toContainText('Lucía Ramos');
  await expect(page.getByText('1 cuenta suspendida en este listado')).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(cuentas).toHaveCount(3);
});

test('suspender en móvil requiere motivo y confirmación; muestra error remoto', async ({
  page,
}) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.locator('.usuario').nth(1).getByRole('button', { name: 'Suspender' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Suspender cuenta' });
  await expect(dialogo).toContainText('Lucía Ramos');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-usuarios-suspender-360.png',
    animations: 'disabled',
  });
  await dialogo.getByRole('button', { name: 'Suspender cuenta' }).click();
  const mensaje = dialogo.getByText('El motivo es obligatorio para suspender la cuenta.');
  await expect(mensaje).toBeVisible();
  await expect(dialogo.getByText('Debes marcar la confirmación para continuar.')).toBeVisible();
  const cajaError = await mensaje.boundingBox();
  const cajaConfirmacion = await dialogo.getByRole('checkbox').boundingBox();
  if (cajaError === null || cajaConfirmacion === null) {
    throw new Error('No se pudo medir la separación entre el motivo y la confirmación.');
  }
  expect(cajaConfirmacion.y).toBeGreaterThan(cajaError.y + cajaError.height);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-usuarios-suspender-error-360.png',
    animations: 'disabled',
  });
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
  await dialogo.getByRole('textbox', { name: 'Motivo de la suspensión' }).fill('Incumplimiento.');
  await dialogo.getByRole('checkbox').check();
  await dialogo.getByRole('button', { name: 'Suspender cuenta' }).click();
  await expect(dialogo.getByRole('alert')).toContainText('El estado de la cuenta ya cambió.');
  await dialogo.getByRole('button', { name: 'Cancelar' }).click();
  await page.locator('.usuario').nth(2).getByRole('button', { name: 'Reactivar' }).click();
  await expect(page.getByRole('dialog', { name: 'Reactivar cuenta' })).toContainText(
    'el motivo de suspensión será eliminado',
  );
});

test('carga, contenido largo, vacío y reintento de error no inventan cuentas', async ({ page }) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const continuar = Promise.withResolvers<void>();
  await page.route('**/api/admin/usuarios*', async (route) => {
    await continuar.promise;
    await route.fulfill({ json: [CLIENTE] });
  });
  await page.reload();
  await expect(page.getByRole('progressbar', { name: 'Cargando usuarios' })).toBeVisible();
  await expect(page.locator('.usuario')).toHaveCount(0);
  continuar.resolve();
  await expect(page.locator('.usuario')).toHaveCount(1);

  let estado: 'largo' | 'vacio' | 'error' = 'largo';
  await page.route('**/api/admin/usuarios*', (route) => {
    if (estado === 'error') {
      return route.fulfill({ status: 503, json: { mensaje: 'Inténtalo nuevamente.' } });
    }
    return route.fulfill({
      json:
        estado === 'vacio'
          ? []
          : [
              {
                ...SUSPENDIDO,
                nombres: 'Pedro José de los Ángeles Guadalupe',
                correo: `${'contacto.'.repeat(9)}@example.test`,
                motivoSuspension: 'Incumplimiento de las normas de uso. '.repeat(9),
              },
            ],
    });
  });
  await page.reload();
  await expect(page.locator('.usuario__identidad h2')).toContainText('Pedro José');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.usuario__motivo').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-usuarios-largo-360.png',
    animations: 'disabled',
  });
  estado = 'vacio';
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Aún no hay usuarios' })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-usuarios-vacio-360.png',
    animations: 'disabled',
  });
  estado = 'error';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los usuarios');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-usuarios-error-360.png',
    animations: 'disabled',
  });
  estado = 'vacio';
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Aún no hay usuarios' })).toBeVisible();
});
