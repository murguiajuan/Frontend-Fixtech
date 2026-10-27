import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { OfertasService } from '../../../ofertas/ofertas.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudDetalle } from '../solicitud.models';
import { SolicitudDetallePage } from './solicitud-detalle.page';

const SOLICITUD: SolicitudDetalle = {
  id: 15,
  estado: 'PUBLICADA',
  urgencia: 'ALTA',
  modalidad: 'DOMICILIO',
  tipoEquipoId: 1,
  tipoServicioId: 2,
  distritoId: 3,
  tipoEquipo: 'Laptop',
  tipoServicio: 'Diagnóstico y reparación',
  distrito: 'Piura',
  marca: 'Lenovo',
  modelo: 'ThinkPad',
  descripcion: 'La laptop no enciende y emite un pitido.',
  direccion: 'Av. Grau 123',
  referencia: 'Frente al mercado',
  fechaPreferida: '2026-10-30',
  horarioPreferido: 'Mañanas',
  presupuestoReferencial: 150,
  fechaVencimiento: '2026-11-03T10:00:00',
  motivoCancelacion: null,
  creadoEn: '2026-10-27T10:00:00',
  imagenPrincipalUrl: null,
  imagenes: [],
};

describe('SolicitudDetallePage', () => {
  const solicitudes = { obtener: vi.fn(), cancelar: vi.fn() };
  const ofertasRecibidas = { listarDelCliente: vi.fn() };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(async () => {
    solicitudes.obtener.mockReset();
    solicitudes.obtener.mockReturnValue(of(SOLICITUD));
    solicitudes.cancelar.mockReset();
    ofertasRecibidas.listarDelCliente.mockReset();
    ofertasRecibidas.listarDelCliente.mockReturnValue(of([]));
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    notificaciones.info.mockReset();

    await TestBed.configureTestingModule({
      imports: [SolicitudDetallePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SolicitudesService, useValue: solicitudes },
        { provide: OfertasService, useValue: ofertasRecibidas },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el detalle completo y las acciones disponibles', async () => {
    const fixture = await crear('15');
    const compilado = fixture.nativeElement as HTMLElement;

    expect(solicitudes.obtener).toHaveBeenCalledWith(15);
    expect(compilado.textContent).toContain('Solicitud #15');
    expect(compilado.textContent).toContain('Laptop · Diagnóstico y reparación');
    expect(compilado.textContent).toContain('La laptop no enciende y emite un pitido.');
    expect(compilado.textContent).toContain('Lenovo');
    expect(compilado.textContent).toContain('ThinkPad');
    expect(compilado.textContent).toContain('Urgencia alta');
    expect(compilado.textContent).toContain('A domicilio');
    expect(compilado.textContent).toContain('Piura');
    expect(compilado.textContent).toContain('Av. Grau 123');
    expect(compilado.textContent).toContain('Frente al mercado');
    expect(compilado.textContent).toContain('Mañanas');
    expect(compilado.textContent).toContain('150.00');
    expect(compilado.textContent).toContain('Esta solicitud no tiene fotos registradas.');
    expect(compilado.textContent).toContain('Editar solicitud');
    expect(compilado.textContent).toContain('Cancelar solicitud');
  });

  it('muestra el estado de carga mientras espera la respuesta', () => {
    const respuesta = new Subject<SolicitudDetalle>();
    solicitudes.obtener.mockReturnValue(respuesta);
    const fixture = crear('15');
    fixture.detectChanges();

    expect(texto(fixture)).toContain('Cargando la solicitud…');

    respuesta.next(SOLICITUD);
    respuesta.complete();
    fixture.detectChanges();

    expect(texto(fixture)).not.toContain('Cargando la solicitud…');
    expect(texto(fixture)).toContain('Solicitud #15');
  });

  it('muestra el motivo y oculta acciones cuando está cancelada', async () => {
    solicitudes.obtener.mockReturnValue(
      of({
        ...SOLICITUD,
        estado: 'CANCELADA' as const,
        motivoCancelacion: 'Ya se resolvió por otro medio.',
      }),
    );
    const fixture = await crear('15');
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Esta solicitud fue cancelada.');
    expect(compilado.textContent).toContain('Motivo: Ya se resolvió por otro medio.');
    expect(compilado.textContent).not.toContain('Editar solicitud');
    expect(compilado.textContent).not.toContain('Cancelar solicitud');
  });

  it('informa cuando el estado ya no admite edición ni cancelación', async () => {
    solicitudes.obtener.mockReturnValue(of({ ...SOLICITUD, estado: 'ACEPTADA' as const }));
    const fixture = await crear('15');
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('ya no admite edición ni cancelación');
    expect(compilado.textContent).not.toContain('Editar solicitud');
    expect(compilado.textContent).not.toContain('Cancelar solicitud');
  });

  it('muestra el error y reintenta la carga', async () => {
    solicitudes.obtener.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { mensaje: 'No se encontró la solicitud.' },
          }),
      ),
    );
    const fixture = await crear('15');
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('No pudimos cargar la solicitud');
    expect(compilado.textContent).toContain('No se encontró la solicitud.');

    solicitudes.obtener.mockReturnValue(of(SOLICITUD));
    pulsarBoton(compilado, 'Reintentar');
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Solicitud #15');
  });

  it('cancela la solicitud con el motivo del diálogo', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of('Ya se resolvió por otro medio.') });
    solicitudes.cancelar.mockReturnValue(
      of({
        ...SOLICITUD,
        estado: 'CANCELADA' as const,
        motivoCancelacion: 'Ya se resolvió por otro medio.',
      }),
    );
    const fixture = await crear('15');
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Cancelar solicitud');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalled();
    expect(solicitudes.cancelar).toHaveBeenCalledWith(15, 'Ya se resolvió por otro medio.');
    expect(notificaciones.exito).toHaveBeenCalledWith('Solicitud cancelada.');
    expect(compilado.textContent).toContain('Esta solicitud fue cancelada.');
  });

  it('no cancela si el diálogo se cierra sin confirmar', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    const fixture = await crear('15');

    pulsarBoton(fixture.nativeElement, 'Cancelar solicitud');
    fixture.detectChanges();

    expect(solicitudes.cancelar).not.toHaveBeenCalled();
  });

  it('informa el error de la API al cancelar', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of(null) });
    solicitudes.cancelar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'La solicitud ya no se puede cancelar.' },
          }),
      ),
    );
    const fixture = await crear('15');

    pulsarBoton(fixture.nativeElement, 'Cancelar solicitud');
    fixture.detectChanges();

    expect(notificaciones.error).toHaveBeenCalledWith('La solicitud ya no se puede cancelar.');
  });

  it('muestra un error cuando el identificador no es válido', () => {
    const fixture = crear('abc');
    fixture.detectChanges();

    expect(solicitudes.obtener).not.toHaveBeenCalled();
    expect(texto(fixture)).toContain('La solicitud indicada no es válida.');
  });
});

function crear(id: string): ComponentFixture<SolicitudDetallePage> {
  const fixture = TestBed.createComponent(SolicitudDetallePage);
  fixture.componentRef.setInput('id', id);
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

function texto(fixture: ComponentFixture<SolicitudDetallePage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}
