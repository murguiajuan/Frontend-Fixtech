import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Catálogos administrativos', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('un administrador crea, edita, desactiva y reactiva catálogos', async ({
    page,
  }, testInfo) => {
    const sufijo = `${Date.now()}-${testInfo.workerIndex}`;
    const nombreEquipo = `Equipo E2E ${sufijo}`;
    const nombreEditado = `${nombreEquipo} editado`;
    const nombreDistrito = `Distrito E2E ${sufijo}`;

    await iniciarSesionAdministrador(page);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Catálogos', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tipos de equipo' }).first()).toBeVisible();
    await verificarAccesibilidad(page);

    await crearEquipo(page, nombreEquipo);
    const tarjeta = tarjetaCatalogo(page, nombreEquipo);
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText('Activo', { exact: true })).toBeVisible();

    await tarjeta.getByRole('button', { name: 'Editar' }).click();
    const dialogoEdicion = page.getByRole('dialog', { name: 'Editar tipo de equipo' });
    await expect(dialogoEdicion).toBeVisible();
    await dialogoEdicion.getByLabel('Nombre', { exact: true }).fill(nombreEditado);
    await esperarAnimaciones(dialogoEdicion);
    await dialogoEdicion.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(dialogoEdicion).toBeHidden();

    const tarjetaEditada = tarjetaCatalogo(page, nombreEditado);
    await expect(tarjetaEditada).toBeVisible();
    await expect(tarjetaEditada.getByText('Activo', { exact: true })).toBeVisible();

    await desactivarCatalogo(page, tarjetaEditada, 'Desactivar tipo de equipo');
    await expect(tarjetaEditada.getByText('Inactivo', { exact: true })).toBeVisible();

    const casillaInactivos = page.getByRole('checkbox', { name: 'Mostrar inactivos' });
    await casillaInactivos.uncheck();
    await expect(tarjetaCatalogo(page, nombreEditado)).toHaveCount(0);

    await casillaInactivos.check();
    await expect(tarjetaCatalogo(page, nombreEditado)).toBeVisible();
    await tarjetaCatalogo(page, nombreEditado).getByRole('button', { name: 'Activar' }).click();
    await expect(
      tarjetaCatalogo(page, nombreEditado).getByText('Activo', { exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Distritos', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Distritos', exact: true }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo distrito', exact: true }).click();
    const dialogoDistrito = page.getByRole('dialog', { name: 'Nuevo distrito' });
    await expect(dialogoDistrito).toBeVisible();
    await dialogoDistrito.getByLabel('Nombre', { exact: true }).fill(nombreDistrito);
    await dialogoDistrito.getByLabel('Provincia', { exact: true }).fill('Piura');
    await dialogoDistrito.getByLabel('Tope de movilidad', { exact: true }).fill('15.50');
    await esperarAnimaciones(dialogoDistrito);
    await verificarAccesibilidad(page, 'mat-dialog-container');
    await dialogoDistrito.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(dialogoDistrito).toBeHidden();

    const tarjetaDistrito = tarjetaCatalogo(page, nombreDistrito);
    await expect(tarjetaDistrito).toBeVisible();
    await expect(tarjetaDistrito).toContainText('Piura · Tope de movilidad S/ 15.50');
    await expect(tarjetaDistrito.getByText('Activo', { exact: true })).toBeVisible();

    await desactivarCatalogo(page, tarjetaDistrito, 'Desactivar distrito');
    await expect(tarjetaDistrito.getByText('Inactivo', { exact: true })).toBeVisible();
  });
});

async function iniciarSesionAdministrador(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);

  const enlaceCatalogos = page.getByRole('link', { name: 'Catálogos', exact: true });
  if (!(await enlaceCatalogos.isVisible())) {
    await page.getByRole('button', { name: /Abrir o cerrar menú de navegación/ }).click();
  }
  await enlaceCatalogos.click();
  await expect(page).toHaveURL(/\/app\/admin\/catalogos/);
}

async function crearEquipo(page: Page, nombre: string): Promise<void> {
  await page.getByRole('button', { name: 'Nuevo tipo de equipo', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Nuevo tipo de equipo' });
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel('Nombre', { exact: true }).fill(nombre);
  await esperarAnimaciones(dialogo);
  await verificarAccesibilidad(page, 'mat-dialog-container');
  await dialogo.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByText(/Se creó tipo de equipo/)).toBeVisible();
}

async function desactivarCatalogo(
  page: Page,
  tarjeta: Locator,
  nombreDialogo: string,
): Promise<void> {
  await tarjeta.getByRole('button', { name: 'Desactivar' }).click();
  const dialogo = page.getByRole('dialog', { name: nombreDialogo });
  await expect(dialogo).toBeVisible();
  await esperarAnimaciones(dialogo);
  await verificarAccesibilidad(page, 'mat-dialog-container');
  await dialogo.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await expect(dialogo).toBeHidden();
}

function tarjetaCatalogo(page: Page, nombre: string): Locator {
  return page.locator('article.catalogo').filter({ hasText: nombre });
}

async function verificarAccesibilidad(page: Page, selector?: string): Promise<void> {
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  const resultado = await (selector === undefined ? builder : builder.include(selector)).analyze();
  expect(resultado.violations).toEqual([]);
}

async function esperarAnimaciones(contenedor: Locator): Promise<void> {
  await contenedor
    .evaluate(async (elemento) => {
      const animaciones = elemento.getAnimations({ subtree: true });
      await Promise.all(animaciones.map((animacion) => animacion.finished));
    })
    .catch(() => undefined);
}
