import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { Notificacion } from '../../core/notificaciones/notificaciones.models';
import { NotificacionesService } from '../../core/notificaciones/notificaciones.service';
import { NotificacionService } from '../../shared/ui/notificacion.service';
import { NotificacionesPage } from './notificaciones.page';

const NO_LEIDA: Notificacion = {
  id: 5,
  tipo: 'PAGO_COMISION_REGISTRADO',
  titulo: 'Pago de comisión por validar',
  mensaje: 'El técnico registró un pago de S/ 12.00.',
  referenciaTipo: 'PAGO_COMISION',
  referenciaId: 13,
  leida: false,
  creadoEn: '2026-10-27T21:57:38',
};

const LEIDA: Notificacion = {
  id: 4,
  tipo: 'SERVICIO_FINALIZADO',
  titulo: 'Servicio finalizado',
  mensaje: 'El servicio #83 quedó finalizado.',
  referenciaTipo: 'SERVICIO',
  referenciaId: 83,
  leida: true,
  creadoEn: '2026-10-27T20:10:00',
};

describe('NotificacionesPage', () => {
  const notificacionesState = signal<readonly Notificacion[]>([]);
  const noLeidasState = signal(0);
  const cargandoState = signal(false);
  const errorState = signal<ApiError | null>(null);
  const soloNoLeidasState = signal(false);
  const ultimaActualizacionState = signal<Date | null>(null);

  const servicio = {
    notificaciones: notificacionesState.asReadonly(),
    noLeidas: noLeidasState.asReadonly(),
    cargando: cargandoState.asReadonly(),
    error: errorState.asReadonly(),
    soloNoLeidas: soloNoLeidasState.asReadonly(),
    ultimaActualizacion: ultimaActualizacionState.asReadonly(),
    cargar: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
  };
  const avisos = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    notificacionesState.set([NO_LEIDA, LEIDA]);
    noLeidasState.set(1);
    cargandoState.set(false);
    errorState.set(null);
    soloNoLeidasState.set(false);
    ultimaActualizacionState.set(new Date('2026-10-27T21:58:00'));

    servicio.cargar.mockReset();
    servicio.cargar.mockReturnValue(of({ notificaciones: [NO_LEIDA, LEIDA], noLeidas: 1 }));
    servicio.marcarLeida.mockReset();
    servicio.marcarLeida.mockReturnValue(of({ ...NO_LEIDA, leida: true }));
    servicio.marcarTodasLeidas.mockReset();
    servicio.marcarTodasLeidas.mockReturnValue(of(undefined));
    avisos.exito.mockReset();
    avisos.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [NotificacionesPage],
      providers: [
        provideRouter([]),
        { provide: NotificacionesService, useValue: servicio },
        { provide: NotificacionService, useValue: avisos },
      ],
    }).compileComponents();
  });

  it('muestra la bandeja, el contador y la referencia', async () => {
    const fixture = await crear();
    const texto = contenido(fixture);

    expect(texto).toContain('Pago de comisión por validar');
    expect(texto).toContain('El técnico registró un pago de S/ 12.00.');
    expect(texto).toContain('1 notificación sin leer');
    expect(texto).toContain('Pago de comisión');
    expect(texto).toContain('#13');
    expect(texto).toContain('Servicio finalizado');
    expect(
      botones(fixture).filter((boton) => boton.textContent?.includes('Marcar como leída')),
    ).toHaveLength(1);
  });

  it('marca una notificación como leída y avisa el resultado', async () => {
    const fixture = await crear();

    pulsarBoton(fixture, 'Marcar como leída');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.marcarLeida).toHaveBeenCalledWith(NO_LEIDA.id);
    expect(avisos.exito).toHaveBeenCalledWith('Notificación marcada como leída.');
  });

  it('informa el error al marcar una notificación', async () => {
    servicio.marcarLeida.mockReturnValue(
      throwError(() => ({ estado: 409, mensaje: 'No se pudo marcar.', detalles: [] })),
    );
    const fixture = await crear();

    pulsarBoton(fixture, 'Marcar como leída');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(avisos.error).toHaveBeenCalledWith('No se pudo marcar.');
  });

  it('marca todas las notificaciones como leídas', async () => {
    noLeidasState.set(2);
    const fixture = await crear();

    pulsarBoton(fixture, 'Marcar todas como leídas');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.marcarTodasLeidas).toHaveBeenCalled();
    expect(avisos.exito).toHaveBeenCalledWith('Todas las notificaciones se marcaron como leídas.');
  });

  it('cambia el filtro y vuelve a consultar la bandeja', async () => {
    const fixture = await crear();
    const casilla = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );

    expect(casilla).not.toBeNull();
    casilla?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.cargar).toHaveBeenLastCalledWith(true);
  });

  it('muestra el estado vacío de la bandeja completa', async () => {
    notificacionesState.set([]);
    noLeidasState.set(0);
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No tienes notificaciones');
    expect(contenido(fixture)).toContain('Cuando ocurra una novedad');
    expect(contenido(fixture)).toContain('Volver al inicio');
  });

  it('muestra el estado vacío del filtro de no leídas y permite ver todas', async () => {
    notificacionesState.set([]);
    noLeidasState.set(0);
    soloNoLeidasState.set(true);
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No tienes notificaciones sin leer');

    pulsarBoton(fixture, 'Ver todas');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.cargar).toHaveBeenLastCalledWith(false);
  });

  it('muestra el error de carga y permite reintentar', async () => {
    notificacionesState.set([]);
    noLeidasState.set(0);
    errorState.set({
      estado: 500,
      mensaje: 'No se pudo obtener la bandeja.',
      detalles: ['Intente más tarde.'],
    });
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar las notificaciones');
    expect(contenido(fixture)).toContain('No se pudo obtener la bandeja.');
    expect(contenido(fixture)).toContain('Intente más tarde.');

    pulsarBoton(fixture, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.cargar).toHaveBeenCalledTimes(2);
  });

  it('muestra el estado de carga inicial', async () => {
    notificacionesState.set([]);
    noLeidasState.set(0);
    cargandoState.set(true);
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Cargando notificaciones…');
  });
});

async function crear(): Promise<ComponentFixture<NotificacionesPage>> {
  const fixture = TestBed.createComponent(NotificacionesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<NotificacionesPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function botones(fixture: ComponentFixture<NotificacionesPage>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  );
}

function pulsarBoton(fixture: ComponentFixture<NotificacionesPage>, texto: string): void {
  const boton = botones(fixture).find((elemento) => elemento.textContent?.includes(texto));
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
