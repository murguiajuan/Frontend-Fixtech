import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

interface CatalogoMock {
  id: number;
  nombre: string;
  activo: boolean;
  descripcion?: string;
  provincia?: string;
  topeMovilidad?: number;
}

interface PeticionCatalogo {
  readonly metodo: string;
  readonly tipo: string;
  readonly payload?: unknown;
}

interface RespuestaMock {
  readonly status?: number;
  readonly json: unknown;
}

type ManejadorPatch = (
  tipo: string,
  id: number,
  activo: boolean,
) => RespuestaMock | Promise<RespuestaMock>;

interface OpcionesCatalogos {
  readonly datos?: Record<string, CatalogoMock[]>;
  readonly patch?: ManejadorPatch;
  readonly demoraListado?: Promise<void>;
  readonly fallarListado?: () => boolean;
}

const CATALOGOS_BASE: Record<string, CatalogoMock[]> = {
  'tipos-equipo': [
    { id: 2, nombre: 'Impresora láser', activo: false },
    { id: 1, nombre: 'Laptop', activo: true },
  ],
  'tipos-servicio': [{ id: 3, nombre: 'Mantenimiento preventivo', activo: true }],
  especialidades: [
    {
      id: 4,
      nombre: 'Redes y conectividad',
      descripcion: 'Instalación y soporte de redes.',
      activo: true,
    },
  ],
  distritos: [
    { id: 6, nombre: 'Catacaos', provincia: 'Piura', topeMovilidad: 18, activo: false },
    { id: 5, nombre: 'Castilla', provincia: 'Piura', topeMovilidad: 12.5, activo: true },
  ],
};

const VALORES_PARAMETROS: Record<string, string> = {
  comision_porcentaje: '0.0600',
  limite_deuda_comision: '30.00',
  plazo_pago_comision_dias: '7',
  vencimiento_solicitud_horas: '72',
  confirmacion_automatica_horas: '48',
  max_rondas_contraoferta: '3',
  garantia_minima_dias: '7',
  max_imagenes_solicitud: '5',
  dias_para_resenar: '15',
  max_cancelaciones_tecnico_30d: '3',
  calificacion_minima_revision: '3.50',
  min_resenas_revision: '5',
  tope_movilidad_defecto: '20.00',
};

const PARAMETROS_BASE = Object.entries(VALORES_PARAMETROS).map(([clave, valor]) => ({
  clave,
  valor,
  descripcion: `Descripción de ${clave}.`,
  actualizadoEn: '2026-10-27T10:00:00',
  actualizadoPorId: 1,
}));

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

async function configurarCatalogos(
  page: Page,
  opciones: OpcionesCatalogos = {},
): Promise<{ datos: Record<string, CatalogoMock[]>; peticiones: PeticionCatalogo[] }> {
  const datos = structuredClone(opciones.datos ?? CATALOGOS_BASE);
  const peticiones: PeticionCatalogo[] = [];

  await page.route(/\/api\/admin\/catalogos\/.+/, async (route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    const partes = url.pathname.split('/');
    const indice = partes.indexOf('catalogos');
    const tipo = partes[indice + 1] ?? '';
    const metodo = peticion.method();
    const id = Number(partes[indice + 2]);

    if (metodo === 'GET') {
      if (opciones.demoraListado !== undefined) {
        await opciones.demoraListado;
      }
      if (opciones.fallarListado?.() === true) {
        return route.fulfill({
          status: 503,
          json: { mensaje: 'El catálogo no está disponible en este momento.' },
        });
      }
      const incluirInactivos = url.searchParams.get('incluirInactivos') === 'true';
      const registros = datos[tipo] ?? [];
      return route.fulfill({
        json: incluirInactivos ? registros : registros.filter((registro) => registro.activo),
      });
    }

    if (metodo === 'POST' && tipo === 'distritos') {
      const payload = peticion.postDataJSON() as {
        nombre: string;
        provincia: string;
        topeMovilidad: number;
      };
      peticiones.push({ metodo, tipo, payload });
      const creado: CatalogoMock = {
        id: Math.max(0, ...(datos['distritos'] ?? []).map((registro) => registro.id)) + 1,
        ...payload,
        activo: true,
      };
      datos['distritos'] = [...(datos['distritos'] ?? []), creado];
      return route.fulfill({ status: 201, json: creado });
    }

    if (metodo === 'PATCH') {
      const payload = peticion.postDataJSON() as { activo: boolean };
      peticiones.push({ metodo, tipo, payload });
      if (opciones.patch !== undefined) {
        const respuesta = await opciones.patch(tipo, id, payload.activo);
        if ((respuesta.status ?? 200) < 400) {
          const registro = datos[tipo]?.find((candidato) => candidato.id === id);
          if (registro !== undefined) {
            registro.activo = payload.activo;
          }
        }
        return route.fulfill({ status: respuesta.status ?? 200, json: respuesta.json });
      }
      const registro = datos[tipo]?.find((candidato) => candidato.id === id);
      if (registro === undefined) {
        return route.fulfill({ status: 404, json: { mensaje: 'El registro no existe.' } });
      }
      registro.activo = payload.activo;
      return route.fulfill({ json: registro });
    }

    if (metodo === 'PUT') {
      const payload = peticion.postDataJSON() as Partial<CatalogoMock>;
      peticiones.push({ metodo, tipo, payload });
      const registro = datos[tipo]?.find((candidato) => candidato.id === id);
      if (registro === undefined) {
        return route.fulfill({ status: 404, json: { mensaje: 'El registro no existe.' } });
      }
      Object.assign(registro, payload);
      return route.fulfill({ json: registro });
    }

    return route.fulfill({ status: 405, json: { mensaje: 'Método no simulado.' } });
  });

  return { datos, peticiones };
}

async function configurarParametros(
  page: Page,
  opciones: {
    readonly estadoInicial?: 'carga' | 'ok' | 'vacio' | 'error';
    readonly demora?: Promise<void>;
  } = {},
): Promise<{
  parametros: Array<(typeof PARAMETROS_BASE)[number]>;
  peticionesPut: unknown[];
  lecturas: () => number;
  cambiarEstado: (estado: 'carga' | 'ok' | 'vacio' | 'error') => void;
  fallarGuardado: (fallar: boolean) => void;
}> {
  let estado = opciones.estadoInicial ?? 'ok';
  let lecturas = 0;
  let fallar = false;
  const parametros = structuredClone(PARAMETROS_BASE);
  const peticionesPut: unknown[] = [];

  await page.route('**/api/admin/parametros', async (route) => {
    const peticion = route.request();
    if (peticion.method() === 'GET') {
      lecturas += 1;
      if (estado === 'carga' && opciones.demora !== undefined) {
        await opciones.demora;
      }
      if (estado === 'error') {
        return route.fulfill({
          status: 503,
          json: { mensaje: 'No se pudieron obtener los parámetros.' },
        });
      }
      if (estado === 'vacio') {
        return route.fulfill({ json: [] });
      }
      return route.fulfill({ json: parametros });
    }

    if (peticion.method() === 'PUT') {
      const payload = peticion.postDataJSON() as {
        parametros: Array<{ clave: string; valor: string }>;
      };
      peticionesPut.push(payload);
      if (fallar) {
        return route.fulfill({
          status: 409,
          json: {
            mensaje: 'No se pudieron guardar los parámetros.',
            detalles: ['El valor cambió mientras editabas.'],
          },
        });
      }
      for (const actualizacion of payload.parametros) {
        const parametro = parametros.find((candidato) => candidato.clave === actualizacion.clave);
        if (parametro !== undefined) {
          parametro.valor = actualizacion.valor;
        }
      }
      return route.fulfill({ json: parametros });
    }

    return route.fulfill({ status: 405, json: { mensaje: 'Método no simulado.' } });
  });

  return {
    parametros,
    peticionesPut,
    lecturas: () => lecturas,
    cambiarEstado: (nuevo) => {
      estado = nuevo;
    },
    fallarGuardado: (valor) => {
      fallar = valor;
    },
  };
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

test('catalogos: activos primero, conteos reales y alta simulada', async ({ page }) => {
  await iniciarSesion(page);
  const { peticiones } = await configurarCatalogos(page, {
    patch: () => ({
      status: 409,
      json: { mensaje: 'El catálogo está en uso y no puede desactivarse.' },
    }),
  });
  await page.goto('/app/admin/catalogos');

  const fichas = page.locator('.catalogo');
  await expect(fichas).toHaveCount(2);
  await expect(fichas.first()).toContainText('Laptop');
  await expect(fichas.nth(1)).toContainText('Impresora láser');
  await expect(page.getByText('2 registros · 1 activo')).toBeVisible();
  await revisarPantalla(page, 'catalogos', 'Catálogos');
  await fichas.first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-catalogos-fichas-360.png',
    animations: 'disabled',
  });

  await fichas.first().getByRole('button', { name: 'Desactivar' }).click();
  const confirmacion = page.getByRole('dialog', { name: 'Desactivar tipo de equipo' });
  await expect(confirmacion).toContainText('dejará de estar disponible');
  await expect(confirmacion).toContainText('Los datos históricos se conservan');
  await page.screenshot({
    path: '/tmp/opencode/fixtech-catalogos-confirmacion-360.png',
    animations: 'disabled',
  });
  await confirmacion.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('El catálogo está en uso y no puede desactivarse.')).toBeVisible();

  await page.getByRole('button', { name: 'Distritos' }).click();
  await expect(fichas).toHaveCount(2);
  await expect(fichas.first()).toContainText('Castilla');
  await expect(fichas.first()).toContainText('Piura · Tope de movilidad S/ 12.50');
  await expect(page.getByText('2 registros · 1 activo')).toBeVisible();

  await page.getByRole('button', { name: 'Nuevo distrito' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Nuevo distrito' });
  await expect(dialogo.getByRole('textbox', { name: 'Nombre' })).toBeVisible();
  await expect(dialogo.getByRole('textbox', { name: 'Provincia' })).toBeVisible();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-catalogos-dialogo-360.png',
    animations: 'disabled',
  });
  const axeDialogo = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(axeDialogo.violations).toEqual([]);

  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo.getByText('El nombre es obligatorio.')).toBeVisible();
  await expect(dialogo.getByText('La provincia es obligatoria.')).toBeVisible();
  await expect(dialogo.getByText('El tope de movilidad es obligatorio.')).toBeVisible();
  await page.waitForTimeout(150);
  const axeErrores = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(axeErrores.violations).toEqual([]);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-catalogos-dialogo-error-360.png',
    animations: 'disabled',
  });

  await dialogo.getByRole('textbox', { name: 'Nombre' }).fill('Tambogrande');
  await dialogo.getByRole('textbox', { name: 'Provincia' }).fill('Piura');
  await dialogo.locator('input[type="number"]').fill('15.5');
  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo).toHaveCount(0);
  await expect(page.getByText('Se creó distrito «Tambogrande».')).toBeVisible();
  const alta = peticiones.find(
    (peticion) => peticion.metodo === 'POST' && peticion.tipo === 'distritos',
  );
  expect(alta?.payload).toEqual({
    nombre: 'Tambogrande',
    provincia: 'Piura',
    topeMovilidad: 15.5,
  });

  await expect(fichas).toHaveCount(3);
  await expect(fichas.filter({ hasText: 'Tambogrande' })).toHaveCount(1);
  await expect(page.getByText('3 registros · 2 activos')).toBeVisible();

  await page.getByRole('checkbox', { name: 'Mostrar inactivos' }).uncheck();
  await expect(fichas).toHaveCount(2);
  await expect(page.getByText('Catacaos')).toHaveCount(0);
  await expect(page.getByText('2 registros activos')).toBeVisible();
});

test('catalogos: una respuesta tardía no reactiva acciones de otro catálogo', async ({ page }) => {
  await iniciarSesion(page);
  const equipo = Promise.withResolvers<void>();
  const distrito = Promise.withResolvers<void>();
  await configurarCatalogos(page, {
    patch: async (tipo, id, activo) => {
      if (tipo === 'tipos-equipo') {
        await equipo.promise;
        return {
          status: 409,
          json: { mensaje: 'El catálogo está en uso y no puede desactivarse.' },
        };
      }
      if (tipo === 'distritos') {
        await distrito.promise;
        return {
          json: { id, nombre: 'Catacaos', provincia: 'Piura', topeMovilidad: 18, activo },
        };
      }
      return { status: 400, json: { mensaje: 'Tipo no simulado.' } };
    },
  });
  await page.goto('/app/admin/catalogos');
  await page.setViewportSize({ width: 360, height: 800 });

  const equipos = page.locator('.catalogo');
  await expect(equipos.first()).toContainText('Laptop');
  await equipos.first().getByRole('button', { name: 'Desactivar' }).click();
  await page
    .getByRole('dialog', { name: 'Desactivar tipo de equipo' })
    .getByRole('button', { name: 'Desactivar' })
    .click();
  await expect(
    equipos.first().getByRole('progressbar', { name: 'Actualizando estado' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Distritos' }).click();
  const distritos = page.locator('.catalogo');
  await expect(distritos).toHaveCount(2);
  const catacaos = distritos.filter({ hasText: 'Catacaos' });
  await catacaos.getByRole('button', { name: 'Activar' }).click();
  await expect(catacaos.getByRole('progressbar', { name: 'Actualizando estado' })).toBeVisible();

  equipo.resolve();
  await page.waitForTimeout(150);
  await expect(page.getByText('El catálogo está en uso y no puede desactivarse.')).toBeVisible();
  await expect(catacaos.getByRole('button', { name: /Activar/ })).toBeDisabled();

  distrito.resolve();
  await expect(page.getByText('Se activó «Catacaos».')).toBeVisible();
  await expect(catacaos.getByRole('progressbar')).toHaveCount(0);
  await expect(catacaos.getByRole('button', { name: 'Desactivar' })).toBeEnabled();
});

test('catalogos: carga, error y vacío sin cifras desactualizadas', async ({ page }) => {
  await iniciarSesion(page);
  const continuar = Promise.withResolvers<void>();
  let fallar = false;
  const { datos } = await configurarCatalogos(page, {
    demoraListado: continuar.promise,
    fallarListado: () => fallar,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/app/admin/catalogos');

  await expect(page.getByRole('progressbar', { name: 'Cargando catálogo' })).toBeVisible();
  await expect(page.locator('.catalogo')).toHaveCount(0);
  await expect(page.getByText(/\d+ registros/)).toHaveCount(0);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-catalogos-carga-360.png',
    animations: 'disabled',
  });
  continuar.resolve();
  await expect(page.locator('.catalogo')).toHaveCount(2);

  fallar = true;
  await page.getByRole('button', { name: 'Especialidades' }).click();
  await expect(page.getByRole('heading', { name: 'No pudimos cargar el catálogo' })).toBeVisible();
  await expect(page.locator('.catalogo')).toHaveCount(0);
  await expect(page.getByText(/\d+ registros/)).toHaveCount(0);
  await revisarAnchos(
    page,
    'catalogos-error',
    page.getByRole('heading', { name: 'No pudimos cargar el catálogo' }),
  );

  fallar = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.locator('.catalogo')).toContainText('Redes y conectividad');

  datos['distritos'] = [];
  await page.getByRole('button', { name: 'Distritos' }).click();
  const vacio = page.getByRole('heading', { name: 'Aún no hay distritos' });
  await expect(vacio).toBeVisible();
  await expect(page.getByText('0 registros · 0 activos')).toBeVisible();
  await revisarAnchos(page, 'catalogos-vacio', vacio);

  await page.getByRole('checkbox', { name: 'Mostrar inactivos' }).uncheck();
  await expect(page.getByText('No hay registros activos')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mostrar inactivos' })).toBeVisible();
});

test('parametros: agrupa, conserva el foco y guarda solo cambios simulados', async ({ page }) => {
  await iniciarSesion(page);
  const mock = await configurarParametros(page);
  await page.goto('/app/admin/parametros');

  await expect(page.locator('.parametro')).toHaveCount(13);
  await expect(page.getByRole('heading', { name: 'Comisiones y pagos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Solicitudes y servicios' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reseñas y calidad' })).toBeVisible();
  await expect(page.getByText('Equivale a 6 % del servicio.')).toBeVisible();

  const comision = page
    .locator('.parametro')
    .filter({ hasText: 'Comisión de FIXTECH' })
    .getByRole('textbox', { name: 'Valor de Comisión de FIXTECH' });
  const imagenes = page
    .locator('.parametro')
    .filter({ hasText: 'Imágenes por solicitud' })
    .getByRole('textbox', { name: 'Valor de Imágenes por solicitud' });

  await comision.fill('0.0750');
  await imagenes.fill('4');
  await expect(page.getByText('2 cambios pendientes')).toBeVisible();
  await expect(page.getByText('1 sin guardar')).toHaveCount(2);
  await revisarPantalla(page, 'parametros', 'Parámetros del sistema');
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeInViewport();
  await page.screenshot({
    path: '/tmp/opencode/fixtech-parametros-cambios-360.png',
    animations: 'disabled',
  });

  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Los parámetros se actualizaron correctamente.')).toBeVisible();
  await expect(page.getByText('No hay cambios pendientes.')).toBeVisible();
  await expect(page.getByText('Equivale a 7.5 % del servicio.')).toBeVisible();
  expect(mock.peticionesPut).toEqual([
    {
      parametros: [
        { clave: 'comision_porcentaje', valor: '0.0750' },
        { clave: 'max_imagenes_solicitud', valor: '4' },
      ],
    },
  ]);
  expect(mock.lecturas()).toBe(1);
  expect(
    mock.parametros.find((parametro) => parametro.clave === 'comision_porcentaje')?.valor,
  ).toBe('0.0750');

  await comision.fill('2');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('1 valor que requiere revisión')).toBeVisible();
  await expect(comision).toBeFocused();
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
  expect(mock.peticionesPut).toHaveLength(1);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-parametros-validacion-360.png',
    animations: 'disabled',
  });
  await page.waitForTimeout(150);
  const axeValidacion = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(axeValidacion.violations).toEqual([]);

  await comision.fill('0.0800');
  const plazo = page
    .locator('.parametro')
    .filter({ hasText: 'Plazo de pago de comisiones' })
    .getByRole('textbox', { name: 'Valor de Plazo de pago de comisiones' });
  await plazo.fill('8');
  mock.fallarGuardado(true);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudieron guardar los parámetros.');
  await expect(page.getByRole('alert')).toContainText('El valor cambió mientras editabas.');
  await expect(page.getByText('2 cambios pendientes')).toBeVisible();
  await expect(comision).toHaveValue('0.0800');
  await expect(plazo).toHaveValue('8');
});

test('parametros: carga, error y vacío no muestran formularios ni cifras falsas', async ({
  page,
}) => {
  await iniciarSesion(page);
  const continuar = Promise.withResolvers<void>();
  const mock = await configurarParametros(page, {
    estadoInicial: 'carga',
    demora: continuar.promise,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/app/admin/parametros');

  await expect(page.getByRole('progressbar', { name: 'Cargando parámetros' })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await page.screenshot({
    path: '/tmp/opencode/fixtech-parametros-carga-360.png',
    animations: 'disabled',
  });
  continuar.resolve();
  await expect(page.locator('.parametro')).toHaveCount(13);

  mock.cambiarEstado('error');
  await page.reload();
  const error = page.getByRole('heading', { name: 'No pudimos cargar los parámetros' });
  await expect(error).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByText(/parámetros configurados/)).toHaveCount(0);
  await revisarAnchos(page, 'parametros-error', error);

  mock.cambiarEstado('vacio');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  const vacio = page.getByRole('heading', { name: 'No hay parámetros configurados' });
  await expect(vacio).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await revisarAnchos(page, 'parametros-vacio', vacio);

  mock.cambiarEstado('ok');
  await page.getByRole('button', { name: 'Volver a consultar' }).click();
  await expect(page.locator('.parametro')).toHaveCount(13);
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});
