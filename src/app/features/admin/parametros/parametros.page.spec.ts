import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AdminParametrosService } from '../services/admin-parametros.service';
import { AdminParametrosPage } from './parametros.page';
import { ClaveParametro, DEFINICIONES_PARAMETRO, ParametroSistema } from './parametros.models';

const VALORES: Record<ClaveParametro, string> = {
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

const PARAMETROS: readonly ParametroSistema[] = DEFINICIONES_PARAMETRO.map((definicion) => ({
  clave: definicion.clave,
  valor: VALORES[definicion.clave],
  descripcion: `Descripción de ${definicion.etiqueta}.`,
  actualizadoEn: '2026-10-27T10:00:00',
  actualizadoPorId: 1,
}));

describe('AdminParametrosPage', () => {
  const servicio = { listar: vi.fn(), actualizar: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of(PARAMETROS));
    servicio.actualizar.mockReset();
    servicio.actualizar.mockReturnValue(of(PARAMETROS));
    notificaciones.exito.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminParametrosPage],
      providers: [
        { provide: AdminParametrosService, useValue: servicio },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('carga los trece parámetros y muestra su estado inicial', async () => {
    const fixture = await crear();

    expect(servicio.listar).toHaveBeenCalledTimes(1);
    const texto = contenido(fixture);
    expect(texto).toContain('Comisión de FIXTECH');
    expect(texto).toContain('Equivale a 6 % del servicio.');
    expect(texto).toContain('No hay cambios pendientes.');
    expect(texto).toContain('Descripción de Comisión de FIXTECH.');
    expect(texto).toContain('Usuario #1');
  });

  it('envía solo los parámetros modificados y recarga la lista', async () => {
    const actualizados = PARAMETROS.map((parametro) =>
      parametro.clave === 'comision_porcentaje' ? { ...parametro, valor: '0.0700' } : parametro,
    );
    servicio.actualizar.mockReturnValue(of(actualizados));
    servicio.listar.mockReturnValueOnce(of(PARAMETROS)).mockReturnValue(of(actualizados));
    const fixture = await crear();

    escribirValor(fixture, 0, '0.0700');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('1 cambio pendiente');

    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.actualizar).toHaveBeenCalledWith({
      parametros: [{ clave: 'comision_porcentaje', valor: '0.0700' }],
    });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Los parámetros se actualizaron correctamente.',
    );
    expect(servicio.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('No hay cambios pendientes.');
  });

  it('descarta los cambios locales y restaura los valores cargados', async () => {
    const fixture = await crear();

    escribirValor(fixture, 0, '0.1000');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('1 cambio pendiente');

    pulsarBoton(fixture.nativeElement, 'Descartar cambios');
    fixture.detectChanges();

    expect(valores(fixture)[0]).toBe('0.0600');
    expect(contenido(fixture)).toContain('No hay cambios pendientes.');
    expect(servicio.actualizar).not.toHaveBeenCalled();
  });

  it('bloquea el guardado cuando un valor está fuera de rango', async () => {
    const fixture = await crear();

    escribirValor(fixture, 0, '2');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(servicio.actualizar).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Debe estar entre');
  });

  it('muestra el error de la API al guardar y conserva los cambios', async () => {
    servicio.actualizar.mockReturnValue(
      throwError(() => ({
        estado: 400,
        mensaje: 'El parámetro comision_porcentaje no es válido.',
        detalles: ['Debe estar entre 0.0001 y 1'],
      })),
    );
    const fixture = await crear();

    escribirValor(fixture, 0, '0.0700');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('El parámetro comision_porcentaje no es válido.');
    expect(contenido(fixture)).toContain('Debe estar entre 0.0001 y 1');
    expect(valores(fixture)[0]).toBe('0.0700');
  });

  it('muestra el estado vacío cuando la API no devuelve parámetros', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No hay parámetros configurados');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener los parámetros.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(PARAMETROS));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar los parámetros');
    expect(contenido(fixture)).toContain('No se pudieron obtener los parámetros.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Comisión de FIXTECH');
  });
});

async function crear(): Promise<ComponentFixture<AdminParametrosPage>> {
  const fixture = TestBed.createComponent(AdminParametrosPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function valores(fixture: ComponentFixture<AdminParametrosPage>): readonly string[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
  ).map((input) => input.value);
}

function escribirValor(
  fixture: ComponentFixture<AdminParametrosPage>,
  indice: number,
  valor: string,
): void {
  const input = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input')[
    indice
  ];
  if (input === undefined) {
    throw new Error(`No se encontró el parámetro en la posición ${indice}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

function enviar(fixture: ComponentFixture<AdminParametrosPage>): void {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
}

function contenido(fixture: ComponentFixture<AdminParametrosPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
