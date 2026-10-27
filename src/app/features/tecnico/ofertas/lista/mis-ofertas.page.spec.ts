import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { ContraofertaRequest, Oferta } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import { crearContraoferta, crearOferta } from '../../../ofertas/testing/oferta.fixtures';
import { MisOfertasPage } from './mis-ofertas.page';

describe('MisOfertasPage', () => {
  const ofertasService = { listarMias: vi.fn(), retirar: vi.fn(), responder: vi.fn() };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    ofertasService.listarMias.mockReset();
    ofertasService.listarMias.mockReturnValue(of([]));
    ofertasService.retirar.mockReset();
    ofertasService.responder.mockReset();
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [MisOfertasPage],
      providers: [
        provideRouter([]),
        { provide: OfertasService, useValue: ofertasService },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('lista las ofertas con sus métricas y el estado de negociación', () => {
    ofertasService.listarMias.mockReturnValue(
      of([
        crearOferta({ id: 7 }),
        crearOferta({
          id: 8,
          estado: 'CONTRAOFERTADA',
          contraofertas: [crearContraoferta({ emisor: 'CLIENTE', montoPropuesto: 140 })],
        }),
        crearOferta({ id: 9, estado: 'ACEPTADA', servicioId: 21 }),
      ]),
    );

    const fixture = crear();
    const texto = contenido(fixture);

    expect(texto).toContain('Ofertas enviadas');
    expect(texto).toContain('Ofertas activas');
    expect(texto).toContain('Contraofertas por responder');
    expect(texto).toContain('Ofertas aceptadas');
    expect(texto).toContain('Solicitud #15 · A domicilio');
    expect(texto).toContain('Responder contraoferta');
    expect(texto).toContain('El cliente aceptó esta oferta');
    expect(texto).toContain('S/ 160.00');
  });

  it('muestra el estado vacío cuando el técnico no ha ofertado', () => {
    const fixture = crear();

    expect(contenido(fixture)).toContain('Aún no has enviado ofertas');
    expect(contenido(fixture)).toContain('Ver solicitudes disponibles');
  });

  it('filtra por estado y permite volver a ver todas', () => {
    ofertasService.listarMias.mockReturnValue(
      of([crearOferta({ id: 7 }), crearOferta({ id: 8, estado: 'RETIRADA' })]),
    );

    const fixture = crear();
    pulsarBoton(fixture, 'Aceptadas');

    expect(contenido(fixture)).toContain('No hay ofertas en este estado');
    expect(contenido(fixture)).toContain('Prueba con otro filtro');

    pulsarBoton(fixture, 'Ver todas');

    expect(contenido(fixture)).toContain('Oferta #7');
    expect(contenido(fixture)).toContain('Oferta #8');
  });

  it('pagina las ofertas de seis en seis', () => {
    ofertasService.listarMias.mockReturnValue(
      of(
        Array.from({ length: 7 }, (_, indice) =>
          crearOferta({
            id: indice + 1,
            creadoEn: `2026-10-${String(27 - indice).padStart(2, '0')}T10:00:00`,
          }),
        ),
      ),
    );

    const fixture = crear();
    expect(contenido(fixture)).toContain('Página 1 de 2');
    expect(articulos(fixture)).toHaveLength(6);

    pulsarBoton(fixture, 'Siguiente');

    expect(contenido(fixture)).toContain('Página 2 de 2');
    expect(articulos(fixture)).toHaveLength(1);
  });

  it('muestra el error de carga y permite reintentar', () => {
    ofertasService.listarMias.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'No se pudo consultar', detalles: [] })),
    );
    ofertasService.listarMias.mockReturnValue(of([crearOferta()]));

    const fixture = crear();
    expect(contenido(fixture)).toContain('No pudimos cargar tus ofertas');
    expect(contenido(fixture)).toContain('No se pudo consultar');

    pulsarBoton(fixture, 'Reintentar');

    expect(ofertasService.listarMias).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Oferta #7');
  });

  it('retira una oferta tras confirmar el diálogo', () => {
    const oferta = crearOferta();
    const retirada: Oferta = { ...oferta, estado: 'RETIRADA' };
    ofertasService.listarMias.mockReturnValue(of([oferta]));
    ofertasService.retirar.mockReturnValue(of(retirada));
    dialogo.open.mockReturnValue({ afterClosed: () => of(true) });

    const fixture = crear();
    pulsarBoton(fixture, 'Retirar oferta');

    expect(ofertasService.retirar).toHaveBeenCalledWith(7);
    expect(notificaciones.exito).toHaveBeenCalledWith('Oferta retirada.');
    expect(contenido(fixture)).toContain('Retiraste esta oferta');
  });

  it('responde una contraoferta del cliente y actualiza la oferta', () => {
    const oferta = crearOferta({
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'CLIENTE', montoPropuesto: 140 })],
    });
    const actualizada = crearOferta({
      estado: 'ENVIADA',
      precioServicio: 140,
      precioTotal: 150,
    });
    const respuesta: ContraofertaRequest = {
      accion: 'ACEPTAR',
      montoPropuesto: null,
      mensaje: null,
    };
    ofertasService.listarMias.mockReturnValue(of([oferta]));
    ofertasService.responder.mockReturnValue(of({ oferta: actualizada, servicio: null }));
    dialogo.open.mockReturnValue({ afterClosed: () => of(respuesta) });

    const fixture = crear();
    expect(contenido(fixture)).toContain('Contraoferta del cliente · ronda 1');

    pulsarBoton(fixture, 'Responder contraoferta');

    expect(ofertasService.responder).toHaveBeenCalledWith(7, respuesta);
    expect(notificaciones.exito).toHaveBeenCalledWith('Respuesta de negociación registrada.');
    expect(contenido(fixture)).toContain('S/ 150.00');
  });

  function crear(): ComponentFixture<MisOfertasPage> {
    const fixture = TestBed.createComponent(MisOfertasPage);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<MisOfertasPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function articulos(fixture: ComponentFixture<MisOfertasPage>): Element[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('article.oferta'));
}

function pulsarBoton(fixture: ComponentFixture<MisOfertasPage>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
