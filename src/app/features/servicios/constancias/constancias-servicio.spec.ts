import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ServiciosService } from '../servicios.service';
import { crearConstancia, crearServicioDetalle } from '../testing/servicio.fixtures';
import { ConstanciaDialog } from './constancia-dialog';
import { ConstanciasServicio } from './constancias-servicio';

describe('ConstanciasServicio', () => {
  const servicios = {
    confirmarConstancia: vi.fn(),
    urlFotoConstancia: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  const crearUrl = vi.fn(() => 'blob:constancia');
  const revocarUrl = vi.fn();
  const crearOriginal = URL.createObjectURL;
  const revocarOriginal = URL.revokeObjectURL;
  let http: HttpTestingController;

  beforeEach(async () => {
    servicios.confirmarConstancia.mockReset();
    servicios.confirmarConstancia.mockReturnValue(of(crearConstancia()));
    servicios.urlFotoConstancia.mockReset();
    servicios.urlFotoConstancia.mockReturnValue('/api/servicios/21/constancias/31/fotos/101');
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
      imports: [ConstanciasServicio],
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

  it('muestra el vacío y el aviso de recepción pendiente en taller', async () => {
    const fixture = await crear('PROGRAMADO', [], false);

    const texto = contenido(fixture);
    expect(texto).toContain('Aún no hay constancias registradas para este servicio.');
    expect(texto).toContain('Falta la constancia de recepción del equipo.');
    expect(texto).toContain('Registrar constancia de recepción');
    expect(texto).not.toContain('Registrar constancia de entrega');
  });

  it('muestra las constancias registradas con sus fotos y accesorios', async () => {
    const constancia = crearConstancia({
      confirmadaPorCliente: true,
      fechaConfirmacion: '2026-10-27T13:00:00',
    });
    const fixture = await crear('EQUIPO_RECIBIDO', [constancia], true);

    http
      .expectOne('http://localhost:8082/api/servicios/21/constancias/31/fotos/101')
      .flush(new Blob(['imagen'], { type: 'image/png' }));
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(servicios.urlFotoConstancia).toHaveBeenCalledWith(21, 31, 101);
    expect(texto).toContain('Recepción del equipo');
    expect(texto).toContain('Confirmada');
    expect(texto).toContain('Cargador original');
    expect(texto).toContain('Equipo con rayones en la tapa.');
    const imagen = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(imagen?.getAttribute('alt')).toBe('Foto de la constancia de recepción del equipo');
    expect(texto).not.toContain('Falta la constancia de recepción del equipo.');
  });

  it('abre el diálogo de recepción y avisa cuando termina', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of(crearConstancia()) });
    const fixture = await crear('PROGRAMADO', [], false);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);

    pulsarBoton(fixture.nativeElement, 'Registrar constancia de recepción');

    expect(dialogo.open).toHaveBeenCalledWith(
      ConstanciaDialog,
      expect.objectContaining({ data: { servicioId: 21, tipo: 'RECEPCION' } }),
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Constancia de recepción registrada.');
    expect(emitido).toHaveBeenCalled();
  });

  it('avisa la entrega pendiente y permite registrarla al estar listo para recoger', async () => {
    const fixture = await crear('LISTO_PARA_RECOGER', [crearConstancia({ fotoIds: [] })], false);

    const texto = contenido(fixture);
    expect(texto).toContain('Falta la constancia de entrega del equipo.');
    expect(texto).toContain('Registrar constancia de entrega');
    expect(texto).not.toContain('Registrar constancia de recepción');
  });

  it('permite al cliente confirmar una constancia pendiente', async () => {
    const actualizada = crearConstancia({
      confirmadaPorCliente: true,
      fechaConfirmacion: '2026-10-27T13:00:00',
      fotoIds: [],
    });
    servicios.confirmarConstancia.mockReturnValue(of(actualizada));
    const fixture = await crear('EQUIPO_RECIBIDO', [crearConstancia({ fotoIds: [] })], true);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);

    pulsarBoton(fixture.nativeElement, 'Confirmar constancia');

    expect(servicios.confirmarConstancia).toHaveBeenCalledWith(21, 31);
    expect(notificaciones.exito).toHaveBeenCalledWith('Constancia confirmada.');
    expect(emitido).toHaveBeenCalled();
  });

  it('no muestra la confirmación al técnico ni a una constancia ya confirmada', async () => {
    const tecnico = await crear('EQUIPO_RECIBIDO', [crearConstancia({ fotoIds: [] })], false);
    expect(contenido(tecnico)).not.toContain('Confirmar constancia');

    const confirmada = await crear(
      'EQUIPO_RECIBIDO',
      [crearConstancia({ confirmadaPorCliente: true, fotoIds: [] })],
      true,
    );
    expect(contenido(confirmada)).not.toContain('Confirmar constancia');
  });

  it('muestra el error al confirmar una constancia', async () => {
    servicios.confirmarConstancia.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'La constancia ya fue confirmada.',
        detalles: [],
      })),
    );
    const fixture = await crear('EQUIPO_RECIBIDO', [crearConstancia({ fotoIds: [] })], true);

    pulsarBoton(fixture.nativeElement, 'Confirmar constancia');

    expect(notificaciones.error).toHaveBeenCalledWith('La constancia ya fue confirmada.');
  });
});

async function crear(
  estado: 'PROGRAMADO' | 'EQUIPO_RECIBIDO' | 'LISTO_PARA_RECOGER',
  constancias: ReturnType<typeof crearConstancia>[],
  esCliente: boolean,
): Promise<ComponentFixture<ConstanciasServicio>> {
  const fixture = TestBed.createComponent(ConstanciasServicio);
  fixture.componentRef.setInput(
    'servicio',
    crearServicioDetalle({ modalidad: 'TALLER', estado, constancias }),
  );
  fixture.componentRef.setInput('esCliente', esCliente);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ConstanciasServicio>): string {
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
