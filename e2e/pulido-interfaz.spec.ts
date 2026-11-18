import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('login: teclado, validación, error remoto y diseño responsive', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Ingresa tu correo electrónico.')).toBeVisible();
  await expect(page.getByText('Ingresa tu contraseña.')).toBeVisible();

  await page.getByLabel('Correo electrónico').fill('persona@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-incorrecta');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password');

  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 401, json: { mensaje: 'Correo o contraseña incorrectos.' } }),
  );
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos.');

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `/tmp/opencode/fixtech-login-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('navegación admin: módulos alcanzables en móvil y escritorio', async ({ page }) => {
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
        correo: 'administracion@example.test',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        nombres: 'Nombre extenso de administración',
        apellidos: 'López',
        fotoUrl: null,
        tecnico: null,
      },
    }),
  );
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/app/perfil');
  await page.getByRole('button', { name: 'Abrir o cerrar menú de navegación' }).click();
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation.getByRole('link', { name: 'Auditoría' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-admin-nav-mobile.png',
    animations: 'disabled',
  });
  await navigation.getByRole('link', { name: 'Auditoría' }).click();
  await expect(page).toHaveURL(/\/app\/admin\/auditoria/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(navigation.getByRole('link', { name: 'Auditoría' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-admin-nav-desktop.png',
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('navegación técnico: oportunidades disponibles en móvil', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('fixtech.access-token', 'token-e2e');
    sessionStorage.setItem('fixtech.refresh-token', 'refresh-e2e');
    sessionStorage.setItem('fixtech.expires-at', String(Date.now() + 3_600_000));
  });
  await page.route('**/api/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        id: 2,
        correo: 'tecnico@example.test',
        rol: 'TECNICO',
        estado: 'ACTIVO',
        nombres: 'Técnico',
        apellidos: 'López',
        fotoUrl: null,
        tecnico: { estadoVerificacion: 'APROBADO', bloqueadoPorDeuda: false },
      },
    }),
  );
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/app/inicio');
  await page.getByRole('button', { name: 'Abrir o cerrar menú de navegación' }).click();
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation.getByRole('link', { name: 'Solicitudes disponibles' })).toBeVisible();
  await navigation.getByRole('link', { name: 'Solicitudes disponibles' }).click();
  await expect(page).toHaveURL(/\/app\/tecnico\/solicitudes/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
