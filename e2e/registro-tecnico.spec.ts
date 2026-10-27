import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BACKEND_DISPONIBLE = process.env['E2E_BACKEND'] === '1';

test.describe('Registro y perfil de técnico', () => {
  test.skip(
    !BACKEND_DISPONIBLE,
    'Requiere el backend y la base de datos locales. Ejecute con E2E_BACKEND=1.',
  );

  test('un técnico se registra, inicia sesión y consulta su perfil en revisión', async ({
    page,
  }, testInfo) => {
    const sufijo = `${Date.now()}-${testInfo.workerIndex}-${Math.floor(Math.random() * 10_000)}`;
    const correo = `e2e.registro.${sufijo}@fixtech.pe`;
    const dni = String(Math.floor(Math.random() * 90_000_000) + 10_000_000);
    const celular = `9${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
    const password = 'Tecnico123!';
    const apellidos = `E2E ${sufijo}`;

    await page.goto('/registro-tecnico');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Registro de técnico' }),
    ).toBeVisible();

    await page.getByLabel('Nombres').fill('Técnico');
    await page.getByLabel('Apellidos').fill(apellidos);
    await page.getByLabel('Correo electrónico').fill(correo);
    await page.getByLabel('Celular').fill(celular);
    await page.getByLabel('DNI').fill(dni);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByLabel('Confirmar contraseña').fill(password);
    await page
      .getByLabel('Descripción profesional')
      .fill('Técnico creado por la prueba E2E de registro y perfil.');
    await page.getByLabel('Años de experiencia').fill('5');

    await page.getByRole('checkbox', { name: 'Atención en taller' }).check();
    await page.getByLabel('Dirección del taller').fill('Av. Grau 123, Piura');
    await page.getByLabel('Referencia del taller (opcional)').fill('Frente al mercado');
    await page.getByLabel('Horario del taller (opcional)').fill('Lunes a sábado, 9:00 a 18:00');

    const especialidades = page.getByRole('group', { name: 'Especialidades', exact: true });
    await expect(especialidades.getByRole('checkbox').first()).toBeVisible();
    await especialidades.getByRole('checkbox').first().check();

    const distritos = page.getByRole('group', { name: 'Distritos de cobertura', exact: true });
    await expect(distritos.getByRole('checkbox').first()).toBeVisible();
    await distritos.getByRole('checkbox').first().check();

    await page.getByRole('checkbox', { name: /Acepto los términos y condiciones/ }).check();

    await esperarAnimaciones(page.locator('app-registro-tecnico-page'));
    const accesibilidadRegistro = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accesibilidadRegistro.violations).toEqual([]);

    await page.getByRole('button', { name: 'Crear cuenta de técnico' }).click();

    await expect(page).toHaveURL(/\/login\?registrado=tecnico/);
    await expect(page.getByText(/Cuenta de técnico creada/)).toBeVisible();

    await page.getByLabel('Correo electrónico').fill(correo);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/app\/inicio/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola');
    await expect(page.getByText('Tu verificación está en revisión.')).toBeVisible();

    if (testInfo.project.name === 'mobile-360') {
      await page.getByRole('button', { name: /Abrir o cerrar menú/ }).click();
    }
    await page.getByRole('link', { name: 'Mi perfil', exact: true }).click();

    await expect(page).toHaveURL(/\/app\/tecnico\/perfil/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Técnico E2E');
    await expect(page.getByText('Tu perfil está en revisión')).toBeVisible();
    await expect(page.getByText('En revisión').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Datos de la cuenta' })).toBeVisible();
    await expect(page.getByText('Solo lectura')).toBeVisible();

    await esperarAnimaciones(page.locator('app-perfil-tecnico-page'));
    const accesibilidadPerfil = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accesibilidadPerfil.violations).toEqual([]);
  });
});

async function esperarAnimaciones(locator: import('@playwright/test').Locator): Promise<void> {
  await locator.evaluate(async (elemento) => {
    const animaciones = elemento.getAnimations({ subtree: true });
    await Promise.all(animaciones.map((animacion) => animacion.finished.catch(() => undefined)));
  });
}
