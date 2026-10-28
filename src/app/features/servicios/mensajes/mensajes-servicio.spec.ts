import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ServiciosService } from '../servicios.service';
import { crearMensaje } from '../testing/servicio.fixtures';
import { MensajesServicio } from './mensajes-servicio';

describe('MensajesServicio', () => {
  const serviciosService = {
    listarMensajes: vi.fn(),
    enviarMensaje: vi.fn(),
  };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    serviciosService.listarMensajes.mockReset();
    serviciosService.enviarMensaje.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    serviciosService.listarMensajes.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MensajesServicio],
      providers: [
        { provide: ServiciosService, useValue: serviciosService },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('carga y muestra la conversación', async () => {
    serviciosService.listarMensajes.mockReturnValue(
      of([
        crearMensaje({ id: 1, mio: false, contenido: 'Estoy en camino.' }),
        crearMensaje({
          id: 2,
          mio: true,
          emisorNombre: 'Cliente E2E',
          contenido: 'Te espero en la puerta.',
          leido: true,
        }),
      ]),
    );

    const fixture = await crear();
    const texto = contenido(fixture);

    expect(serviciosService.listarMensajes).toHaveBeenCalledWith(21);
    expect(texto).toContain('Conversación con María Quispe.');
    expect(texto).toContain('Estoy en camino.');
    expect(texto).toContain('Te espero en la puerta.');
    expect(texto).toContain('Tú');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('La conversación no se actualiza en tiempo real');
  });

  it('muestra el estado vacío', async () => {
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no hay mensajes');
  });

  it('muestra el error y permite reintentar', async () => {
    serviciosService.listarMensajes.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'No se pudo cargar', detalles: [] })),
    );
    serviciosService.listarMensajes.mockReturnValue(
      of([crearMensaje({ contenido: 'Mensaje recuperado.' })]),
    );

    const fixture = await crear();
    expect(contenido(fixture)).toContain('No se pudo cargar');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Mensaje recuperado.');
  });

  it('envía un mensaje, lo agrega a la lista y limpia el campo', async () => {
    const enviado = crearMensaje({
      id: 3,
      mio: true,
      emisorNombre: 'Cliente E2E',
      contenido: 'Voy llegando.',
    });
    serviciosService.enviarMensaje.mockReturnValue(of(enviado));
    const fixture = await crear();

    escribir(fixture.nativeElement, '  Voy llegando.  ');
    pulsarBoton(fixture.nativeElement, 'Enviar');
    fixture.detectChanges();

    expect(serviciosService.enviarMensaje).toHaveBeenCalledWith(21, 'Voy llegando.');
    expect(contenido(fixture)).toContain('Voy llegando.');
    expect(valor(fixture.nativeElement)).toBe('');
  });

  it('no envía mensajes vacíos', async () => {
    const fixture = await crear();

    escribir(fixture.nativeElement, '   ');
    pulsarBoton(fixture.nativeElement, 'Enviar');
    fixture.detectChanges();

    expect(serviciosService.enviarMensaje).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Escribe un mensaje antes de enviarlo.');
  });

  it('muestra el error de la API al enviar', async () => {
    serviciosService.enviarMensaje.mockReturnValue(
      throwError(() => ({ estado: 400, mensaje: 'Mensaje rechazado', detalles: [] })),
    );
    const fixture = await crear();

    escribir(fixture.nativeElement, 'Hola');
    pulsarBoton(fixture.nativeElement, 'Enviar');

    expect(notificaciones.error).toHaveBeenCalledWith('Mensaje rechazado');
  });

  it('recarga la conversación con el botón actualizar', async () => {
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Actualizar');
    fixture.detectChanges();

    expect(serviciosService.listarMensajes).toHaveBeenCalledTimes(2);
  });
});

async function crear(): Promise<ComponentFixture<MensajesServicio>> {
  const fixture = TestBed.createComponent(MensajesServicio);
  fixture.componentRef.setInput('servicioId', 21);
  fixture.componentRef.setInput('contraparteNombre', 'María Quispe');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<MensajesServicio>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(contenedor: HTMLElement, texto: string): void {
  const area = contenedor.querySelector<HTMLTextAreaElement>('textarea');
  if (area === null) {
    throw new Error('No se encontró el campo de mensaje');
  }
  area.value = texto;
  area.dispatchEvent(new Event('input'));
}

function valor(contenedor: HTMLElement): string {
  return contenedor.querySelector<HTMLTextAreaElement>('textarea')?.value ?? '';
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
