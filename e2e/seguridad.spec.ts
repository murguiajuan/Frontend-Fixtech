import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Seguridad y sesión', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('descarta un returnUrl externo después del inicio de sesión', async ({ page }) => {
    await page.goto('/login?returnUrl=https%3A%2F%2Fevil.example%2Fapp');

    await iniciarSesionAdministrador(page);

    await expect(page).toHaveURL(/\/app\/inicio$/);
    expect(new URL(page.url()).origin).toBe('http://localhost:4200');
  });

  test('un rol sin permisos llega a la pantalla de acceso restringido', async ({ page }) => {
    await page.goto('/login');
    await iniciarSesionAdministrador(page);

    await page.goto('/app/tecnico/perfil');

    await expect(page).toHaveURL(/\/no-autorizado$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'No tienes permisos para esta sección' }),
    ).toBeVisible();

    const accesibilidad = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accesibilidad.violations).toEqual([]);
  });

  test('los tokens se guardan en sessionStorage y no en localStorage', async ({ page }) => {
    await page.goto('/login');
    await iniciarSesionAdministrador(page);

    const almacenamiento = await page.evaluate(() => ({
      sesion: Object.keys(globalThis.sessionStorage),
      local: Object.keys(globalThis.localStorage),
    }));

    expect(almacenamiento.sesion).toContain('fixtech.access-token');
    expect(almacenamiento.sesion).toContain('fixtech.refresh-token');
    expect(almacenamiento.local.filter((clave) => clave.startsWith('fixtech.'))).toEqual([]);
  });

  test('el aviso de conexión también aparece dentro de la aplicación', async ({ page }) => {
    await page.goto('/login');
    await iniciarSesionAdministrador(page);

    await page.context().setOffline(true);
    const aviso = page.getByRole('status').filter({ hasText: 'Sin conexión.' });
    await expect(aviso).toBeVisible();

    await page.context().setOffline(false);
    await expect(aviso).toHaveCount(0);
  });
});

async function iniciarSesionAdministrador(page: Page): Promise<void> {
  await page.getByLabel('Correo electrónico').fill('admin@fixtech.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('Admin123!');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/app\/inicio/);
}
