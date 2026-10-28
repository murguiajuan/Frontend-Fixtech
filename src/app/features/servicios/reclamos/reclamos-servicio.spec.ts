import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ServiciosService } from '../servicios.service';
import { crearReclamo, crearServicioDetalle } from '../testing/servicio.fixtures';
import { ReclamoDialog } from './reclamo-dialog';
import { ReclamosServicio } from './reclamos-servicio';

describe('ReclamosServicio', () => {
  const servicios = {
    listarReclamos: vi.fn(),
    responderReclamo: vi.fn(),
    urlFotoReclamo: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  const crearUrl = vi.fn(() => 'blob:reclamo');
  const revocarUrl = vi.fn();
  const crearOriginal = URL.createObjectURL;
  const revocarOriginal = URL.revokeObjectURL;
  let http: HttpTestingController;

  beforeEach(async () => {
    servicios.listarReclamos.mockReset();
    servicios.listarReclamos.mockReturnValue(of([]));
    servicios.responderReclamo.mockReset();
    servicios.responderReclamo.mockReturnValue(
      of(crearReclamo({ respuestaTecnico: 'Revisamos el equipo.', fotoIds: [] })),
    );
    servicios.urlFotoReclamo.mockReset();
    servicios.urlFotoReclamo.mockReturnValue('/api/servicios/21/reclamos/51/fotos/201');
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarUrl,
    });

    await TestBed.configureTestingModule({
      imports: [ReclamosServicio],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ServiciosService, useValue: servicios },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http
      .match((solicitud) => solicitud.url.includes('/fotos/'))
      .forEach((solicitud) => solicitud.flush(new Blob(['imagen'], { type: 'image/png' })));
    http.verify();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearOriginal,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarOriginal,
    });
  });

  it('muestra el vacío del cliente y oculta el registro fuera de los estados permitidos', async () => {
    const fixture = await crear('FINALIZADO', true, false);

    const texto = contenido(fixture);
    expect(texto).toContain('Los reclamos se habilitan cuando el servicio está confirmado.');
    expect(texto).not.toContain('Registrar reclamo');
  });

  it('muestra los reclamos con fotos, respuesta y resolución', async () => {
    servicios.listarReclamos.mockReturnValue(
      of([
        crearReclamo({
          estado: 'RESUELTO',
          respuestaTecnico: 'Revisamos el equipo sin costo.',
          resolucion: 'Se reemplazó el repuesto defectuoso.',
          fechaResolucion: '2026-10-28T10:00:00',
        }),
      ]),
    );
    const fixture = await crear('CALIFICADO', true, false);

    http
      .expectOne('http://localhost:8082/api/servicios/21/reclamos/51/fotos/201')
      .flush(new Blob(['imagen'], { type: 'image/png' }));
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(servicios.urlFotoReclamo).toHaveBeenCalledWith(21, 51, 201);
    expect(texto).toContain('Reclamo #51');
    expect(texto).toContain('El equipo regresó con la misma falla al día siguiente.');
    expect(texto).toContain('Respuesta del técnico');
    expect(texto).toContain('Revisamos el equipo sin costo.');
    expect(texto).toContain('Resolución de administración');
    expect(texto).toContain('Se reemplazó el repuesto defectuoso.');
    const imagen = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(imagen?.getAttribute('alt')).toBe('Foto del reclamo 51');
  });

  it('avisa al cliente que ya existe un reclamo activo', async () => {
    servicios.listarReclamos.mockReturnValue(of([crearReclamo({ fotoIds: [] })]));
    const fixture = await crear('CONFIRMADO', true, false);

    const texto = contenido(fixture);
    expect(texto).toContain('Ya tienes un reclamo activo.');
    expect(texto).toContain('Administración está revisando el reclamo.');
    expect(texto).not.toContain('Registrar reclamo');
  });

  it('abre el diálogo para registrar un reclamo y lo agrega al listado', async () => {
    const nuevo = crearReclamo({ id: 52, fotoIds: [] });
    dialogo.open.mockReturnValue({ afterClosed: () => of(nuevo) });
    const fixture = await crear('CONFIRMADO', true, false);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);

    pulsarBoton(fixture.nativeElement, 'Registrar reclamo');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ReclamoDialog,
      expect.objectContaining({ data: { servicioId: 21 } }),
    );
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Reclamo registrado. El técnico y administración fueron avisados.',
    );
    expect(contenido(fixture)).toContain('Reclamo #52');
    expect(emitido).toHaveBeenCalled();
  });

  it('oculta el registro al cliente cuando no hay un estado habilitado', async () => {
    const fixture = await crear('CALIFICADO', true, false);

    expect(contenido(fixture)).toContain('No registraste reclamos para este servicio.');
    expect(contenido(fixture)).toContain('Registrar reclamo');
  });

  it('permite al técnico responder un reclamo activo una sola vez', async () => {
    servicios.listarReclamos.mockReturnValue(of([crearReclamo({ fotoIds: [] })]));
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ motivo: 'Revisamos el equipo y coordinamos la devolución.' }),
    });
    const fixture = await crear('CONFIRMADO', false, true);

    pulsarBoton(fixture.nativeElement, 'Responder reclamo');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ titulo: 'Responder reclamo #51' }),
      }),
    );
    expect(servicios.responderReclamo).toHaveBeenCalledWith(
      21,
      51,
      'Revisamos el equipo y coordinamos la devolución.',
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Respuesta publicada.');
    expect(contenido(fixture)).toContain('Revisamos el equipo.');
    expect(contenido(fixture)).not.toContain('Responder reclamo');
  });

  it('no permite responder al cliente ni a un reclamo ya respondido', async () => {
    servicios.listarReclamos.mockReturnValue(
      of([crearReclamo({ respuestaTecnico: 'Ya respondido.', fotoIds: [] })]),
    );
    const fixture = await crear('CONFIRMADO', false, true);

    const texto = contenido(fixture);
    expect(texto).not.toContain('Responder reclamo');
    expect(texto).toContain('Respuesta del técnico');
    expect(texto).toContain('Ya respondido.');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicios.listarReclamos
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron consultar los reclamos.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([crearReclamo({ fotoIds: [] })]));
    const fixture = await crear('CONFIRMADO', true, false);

    expect(contenido(fixture)).toContain('No se pudieron consultar los reclamos.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Reclamo #51');
  });

  it('muestra el error al responder un reclamo', async () => {
    servicios.listarReclamos.mockReturnValue(of([crearReclamo({ fotoIds: [] })]));
    servicios.responderReclamo.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'El reclamo ya fue cerrado.',
        detalles: [],
      })),
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: 'Revisado.' }) });
    const fixture = await crear('CONFIRMADO', false, true);

    pulsarBoton(fixture.nativeElement, 'Responder reclamo');

    expect(notificaciones.error).toHaveBeenCalledWith('El reclamo ya fue cerrado.');
  });
});

type Estado = 'CONFIRMADO' | 'CALIFICADO' | 'FINALIZADO';

async function crear(
  estado: Estado,
  esCliente: boolean,
  esTecnico: boolean,
): Promise<ComponentFixture<ReclamosServicio>> {
  const fixture = TestBed.createComponent(ReclamosServicio);
  fixture.componentRef.setInput('servicio', crearServicioDetalle({ estado }));
  fixture.componentRef.setInput('esCliente', esCliente);
  fixture.componentRef.setInput('esTecnico', esTecnico);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ReclamosServicio>): string {
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
