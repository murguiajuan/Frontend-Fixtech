import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SolicitudesDisponiblesPage } from './solicitudes-disponibles.page';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';
import { OfertasService } from '../../../ofertas/ofertas.service';
import { crearOferta, crearSolicitudDisponible } from '../../../ofertas/testing/oferta.fixtures';
import { SolicitudDisponible } from '../../../ofertas/oferta.models';

describe('SolicitudesDisponiblesPage', () => {
  const solicitudesService = { listar: vi.fn(), obtener: vi.fn() };
  const ofertasService = { listarMias: vi.fn() };

  beforeEach(async () => {
    solicitudesService.listar.mockReset();
    solicitudesService.listar.mockReturnValue(of([]));
    ofertasService.listarMias.mockReset();
    ofertasService.listarMias.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SolicitudesDisponiblesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SolicitudesDisponiblesService, useValue: solicitudesService },
        { provide: OfertasService, useValue: ofertasService },
      ],
    }).compileComponents();
  });

  it('lista las solicitudes compatibles y marca las que ya tienen oferta', () => {
    const solicitudes: readonly SolicitudDisponible[] = [
      crearSolicitudDisponible(),
      crearSolicitudDisponible({
        id: 16,
        tipoEquipo: 'Refrigeradora',
        tipoServicio: 'Reparación',
        distrito: 'Castilla',
        descripcion: 'No enfría correctamente.',
      }),
    ];
    solicitudesService.listar.mockReturnValue(of(solicitudes));
    ofertasService.listarMias.mockReturnValue(
      of([crearOferta({ id: 7, solicitudId: 15, estado: 'ENVIADA' })]),
    );

    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('2 solicitudes');
    expect(texto).toContain('1 con oferta');
    expect(texto).toContain('Laptop · Diagnóstico y reparación');
    expect(texto).toContain('Refrigeradora · Reparación');
    expect(texto).toContain('Oferta enviada');
    expect(texto).toContain('Piura');
    expect(texto).toContain('Castilla');
  });

  it('filtra por equipo, servicio o distrito y permite limpiar la búsqueda', () => {
    solicitudesService.listar.mockReturnValue(
      of([
        crearSolicitudDisponible(),
        crearSolicitudDisponible({
          id: 16,
          tipoEquipo: 'Refrigeradora',
          tipoServicio: 'Reparación',
          distrito: 'Castilla',
          descripcion: 'No enfría correctamente.',
        }),
      ]),
    );

    const fixture = crear();
    const buscador = campo(fixture, 'input[type="search"]');
    buscador.value = 'castilla';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Refrigeradora · Reparación');
    expect(contenido(fixture)).not.toContain('Laptop · Diagnóstico y reparación');
    expect(contenido(fixture)).toContain('1 resultado');

    pulsarBoton(fixture, 'Limpiar búsqueda');
    expect(contenido(fixture)).toContain('2 resultados');
  });

  it('muestra el estado vacío cuando no hay solicitudes compatibles', () => {
    const fixture = crear();

    expect(contenido(fixture)).toContain('No hay solicitudes compatibles por ahora');
    expect(contenido(fixture)).toContain('Revisar mi perfil');
  });

  it('muestra un mensaje distinto cuando la búsqueda no tiene coincidencias', () => {
    solicitudesService.listar.mockReturnValue(of([crearSolicitudDisponible()]));
    const fixture = crear();

    const buscador = campo(fixture, 'input[type="search"]');
    buscador.value = 'impresora';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No encontramos coincidencias');
    expect(contenido(fixture)).toContain('Ver todas');
  });

  it('pagina las solicitudes de seis en seis', () => {
    solicitudesService.listar.mockReturnValue(
      of(
        Array.from({ length: 7 }, (_, indice) =>
          crearSolicitudDisponible({
            id: indice + 1,
            tipoEquipo: `Equipo ${indice + 1}`,
          }),
        ),
      ),
    );

    const fixture = crear();
    expect(contenido(fixture)).toContain('Página 1 de 2');
    expect(contenido(fixture)).toContain('Equipo 6');
    expect(contenido(fixture)).not.toContain('Equipo 7');

    pulsarBoton(fixture, 'Siguiente');

    expect(contenido(fixture)).toContain('Página 2 de 2');
    expect(contenido(fixture)).toContain('Equipo 7');
    expect(contenido(fixture)).not.toContain('Equipo 1');
  });

  it('muestra el error y permite reintentar', () => {
    solicitudesService.listar.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'Servidor no disponible', detalles: [] })),
    );
    solicitudesService.listar.mockReturnValue(of([crearSolicitudDisponible()]));

    const fixture = crear();
    expect(contenido(fixture)).toContain('No pudimos cargar las solicitudes disponibles');
    expect(contenido(fixture)).toContain('Servidor no disponible');

    pulsarBoton(fixture, 'Reintentar');

    expect(solicitudesService.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Laptop · Diagnóstico y reparación');
  });

  function crear(): ComponentFixture<SolicitudesDisponiblesPage> {
    const fixture = TestBed.createComponent(SolicitudesDisponiblesPage);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<SolicitudesDisponiblesPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function campo(
  fixture: ComponentFixture<SolicitudesDisponiblesPage>,
  selector: string,
): HTMLInputElement {
  const elemento = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);
  if (elemento === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  return elemento;
}

function pulsarBoton(
  fixture: ComponentFixture<SolicitudesDisponiblesPage>,
  etiqueta: string,
): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
