import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ConfirmarAccionDialog } from '../../../shared/ui/confirmar-accion-dialog';
import { ServiciosService } from '../servicios.service';
import { crearResena, crearServicioDetalle } from '../testing/servicio.fixtures';
import { ResenaServicio } from './resena-servicio';

describe('ResenaServicio', () => {
  const servicios = {
    obtenerResena: vi.fn(),
    registrarResena: vi.fn(),
    responderResena: vi.fn(),
    reportarResena: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicios.obtenerResena.mockReset();
    servicios.obtenerResena.mockReturnValue(of(null));
    servicios.registrarResena.mockReset();
    servicios.registrarResena.mockReturnValue(of(crearResena()));
    servicios.responderResena.mockReset();
    servicios.responderResena.mockReturnValue(of(crearResena({ respuestaTecnico: 'Gracias.' })));
    servicios.reportarResena.mockReset();
    servicios.reportarResena.mockReturnValue(of(crearResena({ estado: 'REPORTADA' })));
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [ResenaServicio],
      providers: [
        { provide: ServiciosService, useValue: servicios },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el formulario al cliente cuando el servicio está confirmado', async () => {
    const fixture = await crear('CONFIRMADO', true, false);

    const texto = contenido(fixture);
    expect(texto).toContain('Reseña del servicio');
    expect(texto).toContain('Calificación general');
    expect(texto).toContain('Publicar reseña');
    expect(
      fixture.nativeElement.querySelectorAll('button[aria-label$="de 5 estrellas"]'),
    ).toHaveLength(5);
  });

  it('explica al cliente que primero debe confirmar la conformidad', async () => {
    const fixture = await crear('FINALIZADO', true, false);

    const texto = contenido(fixture);
    expect(texto).toContain('Confirma la conformidad del servicio para habilitar la reseña.');
    expect(texto).not.toContain('Publicar reseña');
  });

  it('exige seleccionar una calificación antes de publicar', async () => {
    const fixture = await crear('CONFIRMADO', true, false);

    pulsarBoton(fixture.nativeElement, 'Publicar reseña');
    fixture.detectChanges();

    expect(servicios.registrarResena).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Selecciona una calificación de 1 a 5 estrellas.');
  });

  it('publica la reseña con los criterios y el comentario normalizado', async () => {
    const fixture = await crear('CONFIRMADO', true, false);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);

    pulsarEstrella(fixture, 5);
    escribir(
      fixture.nativeElement,
      'textarea[formcontrolname="comentario"]',
      '  Muy buen servicio.  ',
    );
    pulsarBoton(fixture.nativeElement, 'Publicar reseña');

    expect(servicios.registrarResena).toHaveBeenCalledWith(21, {
      estrellas: 5,
      puntualidad: null,
      trato: null,
      calidad: null,
      precioJusto: null,
      comentario: 'Muy buen servicio.',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('Reseña publicada. ¡Gracias por tu opinión!');
    expect(emitido).toHaveBeenCalled();
  });

  it('muestra la reseña existente con criterios, comentario y respuesta', async () => {
    servicios.obtenerResena.mockReturnValue(
      of(crearResena({ respuestaTecnico: 'Gracias por tu preferencia.' })),
    );
    const fixture = await crear('CALIFICADO', true, false);

    const texto = contenido(fixture);
    expect(texto).toContain('Cliente E2E');
    expect(texto).toContain('Puntualidad');
    expect(texto).toContain('5 / 5');
    expect(texto).toContain('Excelente atención y explicación del problema.');
    expect(texto).toContain('Respuesta del técnico');
    expect(texto).toContain('Gracias por tu preferencia.');
    expect(texto).not.toContain('Publicar reseña');
  });

  it('muestra el estado reportado y no permite volver a reportar', async () => {
    servicios.obtenerResena.mockReturnValue(
      of(crearResena({ estado: 'REPORTADA', motivoReporte: 'Incluye datos personales.' })),
    );
    const fixture = await crear('CALIFICADO', false, true);

    const texto = contenido(fixture);
    expect(texto).toContain('Reseña reportada.');
    expect(texto).toContain('Motivo: Incluye datos personales.');
    expect(texto).not.toContain('Reportar reseña');
    expect(texto).not.toContain('Responder reseña');
  });

  it('permite al técnico responder una reseña visible una sola vez', async () => {
    servicios.obtenerResena.mockReturnValue(of(crearResena()));
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ motivo: 'Gracias por tu comentario.' }),
    });
    const fixture = await crear('CALIFICADO', false, true);

    pulsarBoton(fixture.nativeElement, 'Responder reseña');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ConfirmarAccionDialog,
      expect.objectContaining({
        data: expect.objectContaining({ titulo: 'Responder reseña' }),
      }),
    );
    expect(servicios.responderResena).toHaveBeenCalledWith(21, 41, 'Gracias por tu comentario.');
    expect(notificaciones.exito).toHaveBeenCalledWith('Respuesta publicada.');
    expect(contenido(fixture)).toContain('Gracias.');
    expect(contenido(fixture)).not.toContain('Responder reseña');
  });

  it('permite al técnico reportar una reseña visible', async () => {
    servicios.obtenerResena.mockReturnValue(of(crearResena()));
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ motivo: 'Contiene datos personales.' }),
    });
    const fixture = await crear('CALIFICADO', false, true);

    pulsarBoton(fixture.nativeElement, 'Reportar reseña');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ConfirmarAccionDialog,
      expect.objectContaining({ data: expect.objectContaining({ titulo: 'Reportar reseña' }) }),
    );
    expect(servicios.reportarResena).toHaveBeenCalledWith(21, 41, 'Contiene datos personales.');
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Reseña reportada. Administración la revisará.',
    );
  });

  it('muestra el vacío al técnico cuando el cliente aún no dejó reseña', async () => {
    const fixture = await crear('CONFIRMADO', false, true);

    const texto = contenido(fixture);
    expect(texto).toContain('El cliente aún no registró una reseña para este servicio.');
    expect(texto).not.toContain('Publicar reseña');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicios.obtenerResena
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo consultar la reseña.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(crearResena()));
    const fixture = await crear('CALIFICADO', true, false);

    expect(contenido(fixture)).toContain('No se pudo consultar la reseña.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Cliente E2E');
  });
});

async function crear(
  estado: 'CONFIRMADO' | 'CALIFICADO' | 'FINALIZADO',
  esCliente: boolean,
  esTecnico: boolean,
): Promise<ComponentFixture<ResenaServicio>> {
  const fixture = TestBed.createComponent(ResenaServicio);
  fixture.componentRef.setInput('servicio', crearServicioDetalle({ estado }));
  fixture.componentRef.setInput('esCliente', esCliente);
  fixture.componentRef.setInput('esTecnico', esTecnico);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ResenaServicio>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarEstrella(fixture: ComponentFixture<ResenaServicio>, valor: number): void {
  const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
    `button[aria-label="${valor} de 5 estrellas"]`,
  );
  if (boton === null) {
    throw new Error(`No se encontró la estrella ${valor}`);
  }
  boton.click();
  fixture.detectChanges();
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const campo = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (campo === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
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
