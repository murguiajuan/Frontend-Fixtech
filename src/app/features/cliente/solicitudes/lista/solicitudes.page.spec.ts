import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudResumen } from '../solicitud.models';
import { SolicitudesPage } from './solicitudes.page';

function crearSolicitud(id: number, overrides: Partial<SolicitudResumen> = {}): SolicitudResumen {
  return {
    id,
    estado: 'PUBLICADA',
    urgencia: 'MEDIA',
    modalidad: 'DOMICILIO',
    tipoEquipo: 'Laptop',
    tipoServicio: 'Diagnóstico y reparación',
    distrito: 'Piura',
    marca: 'Lenovo',
    modelo: 'ThinkPad',
    descripcion: `Solicitud de prueba ${id}`,
    presupuestoReferencial: 150,
    fechaVencimiento: '2026-11-03T10:00:00',
    creadoEn: '2026-10-27T10:00:00',
    imagenPrincipalUrl: null,
    ...overrides,
  };
}

describe('SolicitudesPage', () => {
  const servicio = { listarMias: vi.fn() };

  beforeEach(async () => {
    servicio.listarMias.mockReset();
    servicio.listarMias.mockReturnValue(of([crearSolicitud(1)]));

    await TestBed.configureTestingModule({
      imports: [SolicitudesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SolicitudesService, useValue: servicio },
      ],
    }).compileComponents();
  });

  it('muestra el listado con estado, urgencia y presupuesto', async () => {
    const fixture = await crear();

    expect(servicio.listarMias).toHaveBeenCalledWith(undefined);
    expect(texto(fixture)).toContain('Mis solicitudes');
    expect(texto(fixture)).toContain('Laptop · Diagnóstico y reparación');
    expect(texto(fixture)).toContain('Solicitud de prueba 1');
    expect(texto(fixture)).toContain('Publicada');
    expect(texto(fixture)).toContain('Urgencia media');
    expect(texto(fixture)).toContain('Piura');
    expect(texto(fixture)).toContain('150.00');
    expect(texto(fixture)).toContain('Ver detalle');
  });

  it('muestra el estado de carga mientras espera la respuesta', async () => {
    const respuesta = new Subject<readonly SolicitudResumen[]>();
    servicio.listarMias.mockReturnValue(respuesta);
    const fixture = TestBed.createComponent(SolicitudesPage);
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Cargando tus solicitudes…');

    respuesta.next([crearSolicitud(1)]);
    respuesta.complete();
    fixture.detectChanges();

    expect(texto(fixture)).not.toContain('Cargando tus solicitudes…');
    expect(texto(fixture)).toContain('Solicitud de prueba 1');
  });

  it('muestra el estado vacío inicial con acceso a crear una solicitud', async () => {
    servicio.listarMias.mockReturnValue(of([]));
    const fixture = await crear();

    expect(texto(fixture)).toContain('Aún no tienes solicitudes');
    expect(texto(fixture)).toContain('Crear solicitud');
    expect(texto(fixture)).toContain('Nueva solicitud');
  });

  it('muestra el estado vacío de un filtro y permite limpiarlo', async () => {
    servicio.listarMias.mockReturnValue(of([]));
    const fixture = await crear();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Cancelada');
    fixture.detectChanges();

    expect(servicio.listarMias).toHaveBeenLastCalledWith('CANCELADA');
    expect(texto(fixture)).toContain('No hay solicitudes en este estado');

    pulsarBoton(fixture.nativeElement, 'Ver todas');
    fixture.detectChanges();

    expect(servicio.listarMias).toHaveBeenLastCalledWith(undefined);
  });

  it('filtra por estado contra el backend', async () => {
    const fixture = await crear();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Con ofertas');
    fixture.detectChanges();

    expect(servicio.listarMias).toHaveBeenLastCalledWith('CON_OFERTAS');
    const boton = buscarBoton(fixture.nativeElement, 'Con ofertas');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
  });

  it('muestra el error y reintenta la carga', async () => {
    servicio.listarMias.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { mensaje: 'No se pudo consultar el listado.' },
          }),
      ),
    );
    const fixture = await crear();

    expect(texto(fixture)).toContain('No pudimos cargar tus solicitudes');
    expect(texto(fixture)).toContain('No se pudo consultar el listado.');

    servicio.listarMias.mockReturnValue(of([crearSolicitud(2)]));
    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Solicitud de prueba 2');
    expect(texto(fixture)).not.toContain('No pudimos cargar tus solicitudes');
  });

  it('pagina el listado de seis en seis', async () => {
    const solicitudes = Array.from({ length: 8 }, (_valor, indice) => crearSolicitud(indice + 1));
    servicio.listarMias.mockReturnValue(of(solicitudes));
    const fixture = await crear();

    expect(contarSolicitudes(fixture.nativeElement)).toBe(6);
    expect(texto(fixture)).toContain('Página 1 de 2');
    expect(texto(fixture)).toContain('Solicitud de prueba 6');
    expect(texto(fixture)).not.toContain('Solicitud de prueba 7');

    pulsarBoton(fixture.nativeElement, 'Siguiente');
    fixture.detectChanges();

    expect(contarSolicitudes(fixture.nativeElement)).toBe(2);
    expect(texto(fixture)).toContain('Página 2 de 2');
    expect(texto(fixture)).toContain('Solicitud de prueba 7');
    expect(texto(fixture)).toContain('Solicitud de prueba 8');

    pulsarBoton(fixture.nativeElement, 'Anterior');
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Página 1 de 2');
  });

  it('vuelve a la primera página al cambiar de filtro', async () => {
    const solicitudes = Array.from({ length: 8 }, (_valor, indice) => crearSolicitud(indice + 1));
    servicio.listarMias.mockReturnValue(of(solicitudes));
    const fixture = await crear();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Siguiente');
    fixture.detectChanges();
    expect(texto(fixture)).toContain('Página 2 de 2');

    servicio.listarMias.mockReturnValue(of([crearSolicitud(9, { estado: 'CON_OFERTAS' })]));
    pulsarBoton(fixture.nativeElement, 'Con ofertas');
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Solicitud de prueba 9');
    expect(texto(fixture)).not.toContain('Solicitud de prueba 7');
    expect(texto(fixture)).not.toContain('Página 2 de 2');
  });
});

async function crear(): Promise<ComponentFixture<SolicitudesPage>> {
  const fixture = TestBed.createComponent(SolicitudesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function buscarBoton(contenedor: HTMLElement, texto: string): HTMLButtonElement {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  return boton;
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  buscarBoton(contenedor, texto).click();
}

function contarSolicitudes(contenedor: HTMLElement): number {
  return contenedor.querySelectorAll('article.solicitud').length;
}

function texto(fixture: ComponentFixture<SolicitudesPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}
