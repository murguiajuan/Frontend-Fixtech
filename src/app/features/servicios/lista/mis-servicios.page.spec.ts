import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ServiciosService } from '../servicios.service';
import { crearServicioListado } from '../testing/servicio.fixtures';
import { MisServiciosPage } from './mis-servicios.page';

describe('MisServiciosPage', () => {
  const serviciosService = { listarMios: vi.fn() };
  let rol: 'CLIENTE' | 'TECNICO';
  const auth = { rol: () => rol };

  beforeEach(async () => {
    rol = 'CLIENTE';
    serviciosService.listarMios.mockReset();
    serviciosService.listarMios.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MisServiciosPage],
      providers: [
        provideRouter([]),
        { provide: ServiciosService, useValue: serviciosService },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('lista los servicios del cliente con su contraparte y monto', async () => {
    serviciosService.listarMios.mockReturnValue(
      of([
        crearServicioListado({ id: 21, estado: 'EN_PROCESO' }),
        crearServicioListado({
          id: 22,
          estado: 'FINALIZADO',
          montoFinal: 180,
          contraparteNombre: 'Carlos Ramos',
        }),
      ]),
    );

    const fixture = await crear();
    const texto = contenido(fixture);

    expect(serviciosService.listarMios).toHaveBeenCalled();
    expect(texto).toContain('Servicio #21');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('Servicio #22');
    expect(texto).toContain('Carlos Ramos');
    expect(texto).toContain('S/ 180.00');
    expect(texto).toContain('Técnico:');
    expect(texto).toContain('Ver detalle');
  });

  it('filtra por estado y muestra el conteo correcto', async () => {
    serviciosService.listarMios.mockReturnValue(
      of([
        crearServicioListado({ id: 21, estado: 'EN_PROCESO' }),
        crearServicioListado({ id: 22, estado: 'CANCELADO' }),
        crearServicioListado({ id: 23, estado: 'FINALIZADO' }),
      ]),
    );

    const fixture = await crear();
    pulsarBoton(fixture.nativeElement, 'Cancelados');
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(texto).toContain('Servicio #22');
    expect(texto).not.toContain('Servicio #21');
    expect(texto).not.toContain('Servicio #23');
    expect(texto).toContain('1 servicio');
  });

  it('muestra el estado vacío cuando no hay servicios', async () => {
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no tienes servicios');
    expect(contenido(fixture)).toContain('Cuando aceptes la oferta de un técnico');
  });

  it('muestra el vacío del filtro y permite volver a todos', async () => {
    serviciosService.listarMios.mockReturnValue(
      of([crearServicioListado({ estado: 'EN_PROCESO' })]),
    );
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Cancelados');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('No hay servicios en este filtro');

    pulsarBoton(fixture.nativeElement, 'Ver todos');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Servicio #21');
  });

  it('muestra el error y permite reintentar', async () => {
    serviciosService.listarMios.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'No se pudo consultar', detalles: [] })),
    );
    serviciosService.listarMios.mockReturnValue(of([crearServicioListado()]));

    const fixture = await crear();
    expect(contenido(fixture)).toContain('No pudimos cargar tus servicios');
    expect(contenido(fixture)).toContain('No se pudo consultar');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Servicio #21');
  });

  it('adapta la vista y las rutas al técnico', async () => {
    rol = 'TECNICO';
    serviciosService.listarMios.mockReturnValue(of([crearServicioListado()]));

    const fixture = await crear();
    const texto = contenido(fixture);

    expect(texto).toContain('Cliente: María Quispe');
    expect(texto).toContain('Mis ofertas');
    expect(texto).not.toContain('Cuando aceptes la oferta de un técnico');
    const enlace = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/app/tecnico/servicios/21"]',
    );
    expect(enlace).not.toBeNull();
  });
});

async function crear(): Promise<ComponentFixture<MisServiciosPage>> {
  const fixture = TestBed.createComponent(MisServiciosPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<MisServiciosPage>): string {
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
