import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const VISIBLE = {
  id: 41,
  servicioId: 21,
  tecnicoId: 9,
  tecnicoNombre: 'María Quispe',
  clienteNombre: 'Lucía Ramos',
  estrellas: 5,
  puntualidad: 5,
  trato: 4,
  calidad: 5,
  precioJusto: 4,
  comentario: 'Excelente atención y explicación del problema.',
  respuestaTecnico: null,
  fechaRespuesta: null,
  estado: 'VISIBLE',
  motivoReporte: null,
  creadoEn: '2026-10-27T16:00:00',
};

const REPORTADA = {
  ...VISIBLE,
  id: 42,
  servicioId: 22,
  clienteNombre: 'Ana Torres',
  estado: 'REPORTADA',
  estrellas: 2,
  comentario: 'El servicio no resolvió el problema.',
  motivoReporte: 'Incluye información personal.',
  respuestaTecnico: 'Estamos revisando el caso.',
};

const OCULTA = {
  ...VISIBLE,
  id: 43,
  servicioId: 23,
  clienteNombre: 'Pedro Silva',
  estado: 'OCULTA',
  comentario: null,
  puntualidad: null,
  trato: null,
  calidad: null,
  precioJusto: null,
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
  await page.route('**/api/admin/resenas*', (route) => {
    const estado = new URL(route.request().url()).searchParams.get('estado');
    return route.fulfill({
      json: [VISIBLE, REPORTADA, OCULTA].filter(
        (resena) => estado === null || resena.estado === estado,
      ),
    });
  });
  await page.goto('/app/admin/resenas');
}

test('prioriza reportadas, respeta los estados y presenta bien las fichas', async ({ page }) => {
  await iniciarPagina(page);
  const fichas = page.locator('.resena');
  await expect(fichas).toHaveCount(3);
  await expect(fichas.first()).toContainText('Ana Torres');
  await expect(page.getByText('1 reportada en este listado')).toBeVisible();
  await expect(fichas.first().getByRole('button', { name: 'Ocultar reseña' })).toBeVisible();
  await expect(fichas.nth(1).getByRole('button', { name: 'Ocultar reseña' })).toHaveCount(0);
  await expect(fichas.nth(2).getByRole('button', { name: 'Habilitar reseña' })).toHaveCount(0);

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('heading', { name: 'Reseñas', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-resenas-${width}.png`,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultado.violations).toEqual([]);
    await fichas.last().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/opencode/fixtech-resenas-fichas-${width}.png`,
      animations: 'disabled',
    });
  }

  await page.getByRole('combobox', { name: 'Estado de la reseña' }).click();
  await page.getByRole('option', { name: 'Visible' }).click();
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(fichas).toHaveCount(1);
  await expect(fichas.first()).toContainText('Lucía Ramos');
  await expect(page.getByText('1 reportada en este listado')).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(fichas).toHaveCount(3);
});

test('la moderación móvil exige confirmación y nunca cambia datos al cancelar', async ({
  page,
}) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 780 });
  let intentos = 0;
  await page.route('**/api/admin/resenas/*/moderacion', (route) => {
    intentos += 1;
    return route.fulfill({ status: 409, json: { mensaje: 'La reseña ya fue moderada.' } });
  });
  const ficha = page.locator('.resena').first();
  await ficha.getByRole('button', { name: 'Ocultar reseña' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ocultar reseña' });
  await expect(dialogo).toContainText('no contará para su calificación');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-resenas-confirmacion-360.png',
    animations: 'disabled',
  });
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
  await dialogo.getByRole('button', { name: 'Volver' }).click();
  expect(intentos).toBe(0);
  await ficha.getByRole('button', { name: 'Habilitar reseña' }).click();
  await expect(page.getByRole('dialog', { name: 'Habilitar reseña' })).toContainText(
    'volverá a mostrarse',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Habilitar reseña' }).click();
  await expect(page.getByText('La reseña ya fue moderada.')).toBeVisible();
  expect(intentos).toBe(1);
  await expect(ficha.getByRole('button', { name: 'Ocultar reseña' })).toBeVisible();
});

test('carga, texto largo, vacío y error con reintento', async ({ page }) => {
  await iniciarPagina(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const continuar = Promise.withResolvers<void>();
  await page.route('**/api/admin/resenas*', async (route) => {
    await continuar.promise;
    await route.fulfill({ json: [REPORTADA] });
  });
  await page.reload();
  await expect(page.getByRole('progressbar', { name: 'Cargando reseñas' })).toBeVisible();
  await expect(page.locator('.resena')).toHaveCount(0);
  continuar.resolve();
  await expect(page.locator('.resena')).toHaveCount(1);

  let estado: 'largo' | 'vacio' | 'error' = 'largo';
  await page.route('**/api/admin/resenas*', (route) => {
    if (estado === 'error') {
      return route.fulfill({ status: 503, json: { mensaje: 'Inténtalo nuevamente.' } });
    }
    return route.fulfill({
      json:
        estado === 'vacio'
          ? []
          : [
              {
                ...REPORTADA,
                clienteNombre: 'Ana María de los Ángeles Guadalupe',
                tecnicoNombre: 'Pedro José de los Ángeles Silva',
                comentario: 'El servicio no resolvió el problema. '.repeat(12),
                motivoReporte: 'Incluye información personal. '.repeat(12),
              },
            ],
    });
  });
  await page.reload();
  await expect(page.locator('.resena__comentario')).toContainText('El servicio no resolvió');
  await page.locator('.resena__acciones').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-resenas-largo-360.png',
    animations: 'disabled',
  });
  estado = 'vacio';
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Aún no hay reseñas' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-resenas-vacio-360.png',
    animations: 'disabled',
  });
  estado = 'error';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar las reseñas');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-resenas-error-360.png',
    animations: 'disabled',
  });
  estado = 'vacio';
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('heading', { name: 'Aún no hay reseñas' })).toBeVisible();
});
