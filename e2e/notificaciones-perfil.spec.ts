import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Notificaciones y perfil de cuenta', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('el administrador consulta sus notificaciones y su cuenta con accesibilidad', async ({
    page,
  }) => {
    await iniciarSesionAdministrador(page);

    const enlaceNotificaciones = page.getByRole('link', { name: /^Notificaciones:/ });
    await expect(enlaceNotificaciones).toBeVisible();
    await enlaceNotificaciones.click();

    await expect(page).toHaveURL(/\/app\/notificaciones/);
    await expect(page.getByRole('heading', { level: 1, name: 'Notificaciones' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Bandeja de entrada' }).or(
        page.getByRole('heading', {
          level: 2,
          name: 'No tienes notificaciones',
        }),
      ),
    ).toBeVisible();
    await expect(page.getByText('No pudimos cargar las notificaciones')).toHaveCount(0);

    const casilla = page.getByRole('checkbox', { name: 'Mostrar solo no leídas' });
    await expect(casilla).toBeVisible();

    const respuestaFiltro = page.waitForResponse(
      (respuesta) =>
        respuesta.url().includes('/api/notificaciones') &&
        respuesta.url().includes('soloNoLeidas=true') &&
        respuesta.request().method() === 'GET',
    );
    await casilla.check();
    expect((await respuestaFiltro).ok()).toBe(true);

    await expect(page.getByText('No pudimos cargar las notificaciones')).toHaveCount(0);
    await verificarAccesibilidad(page);

    await page.goto('/app/perfil');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Datos de la cuenta' })).toBeVisible();
    await expect(page.getByText('Esta vista es de solo lectura')).toBeVisible();
    await expect(
      page.getByRole('definition').filter({ hasText: 'admin@fixtech.pe' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Editar perfil/ })).toHaveCount(0);
    await verificarAccesibilidad(page);
  });

  test('el aviso de sesión expirada es visible y accesible', async ({ page }) => {
    await page.goto('/login?sesion=expirada');

    const aviso = page.getByRole('alert').filter({ hasText: 'Tu sesión expiró por seguridad.' });
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('Vuelve a iniciar sesión para continuar usando FIXTECH.');
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();

    await verificarAccesibilidad(page);
  });
});

async function iniciarSesionAdministrador(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);
}

async function verificarAccesibilidad(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
}
