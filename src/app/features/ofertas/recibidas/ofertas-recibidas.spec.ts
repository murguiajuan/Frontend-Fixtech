import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { EstadoSolicitud } from '../../cliente/solicitudes/solicitud.models';
import { ContraofertaRequest, ServicioResumen } from '../oferta.models';
import { OfertasService } from '../ofertas.service';
import { OfertasRecibidas } from './ofertas-recibidas';
import { crearContraoferta, crearOferta } from '../testing/oferta.fixtures';

const SERVICIO: ServicioResumen = {
  id: 21,
  solicitudId: 15,
  ofertaId: 7,
  clienteId: 2,
  tecnicoId: 9,
  modalidad: 'DOMICILIO',
  estado: 'PROGRAMADO',
  precioServicio: 140,
  costoMovilidad: 10,
  costoDiagnostico: 20,
  montoTotal: 150,
  montoFinal: null,
  garantiaDias: 30,
  creadoEn: '2026-10-27T12:00:00',
};

describe('OfertasRecibidas', () => {
  const ofertasService = {
    listarDelCliente: vi.fn(),
    comparar: vi.fn(),
    responder: vi.fn(),
    aceptar: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  let router: Router;

  beforeEach(async () => {
    ofertasService.listarDelCliente.mockReset();
    ofertasService.listarDelCliente.mockReturnValue(of([]));
    ofertasService.comparar.mockReset();
    ofertasService.responder.mockReset();
    ofertasService.aceptar.mockReset();
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [OfertasRecibidas],
      providers: [
        provideRouter([]),
        { provide: OfertasService, useValue: ofertasService },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('lista las ofertas recibidas con la información del técnico', () => {
    ofertasService.listarDelCliente.mockReturnValue(
      of([crearOferta({ id: 7 }), crearOferta({ id: 8, precioTotal: 190 })]),
    );

    const fixture = crear('PUBLICADA');
    const texto = contenido(fixture);

    expect(texto).toContain('Ofertas recibidas');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('4.8');
    expect(texto).toContain('(24 reseñas)');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('S/ 190.00');
    expect(texto).toContain('El total suma el precio del servicio y la movilidad');
    expect(texto).toContain('Hacer contraoferta');
    expect(texto).toContain('Historial de negociación');
  });

  it('muestra el estado vacío cuando no hay ofertas', () => {
    const fixture = crear('PUBLICADA');

    expect(contenido(fixture)).toContain('Aún no has recibido ofertas');
    expect(contenido(fixture)).toContain('Actualizar');
  });

  it('muestra el error y permite reintentar', () => {
    ofertasService.listarDelCliente.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'Error al consultar', detalles: [] })),
    );
    ofertasService.listarDelCliente.mockReturnValue(of([crearOferta()]));

    const fixture = crear('PUBLICADA');
    expect(contenido(fixture)).toContain('Error al consultar');

    pulsarBoton(fixture, 'Reintentar');

    expect(contenido(fixture)).toContain('María Quispe');
  });

  it('cambia el orden y vuelve a consultar las ofertas', () => {
    ofertasService.listarDelCliente.mockReturnValue(of([crearOferta()]));

    const fixture = crear('PUBLICADA');
    pulsarBoton(fixture, 'calificación');

    expect(ofertasService.listarDelCliente).toHaveBeenLastCalledWith(15, 'CALIFICACION');
  });

  it('permite seleccionar hasta tres ofertas y abrir la comparación', () => {
    const ofertas = [
      crearOferta({ id: 7 }),
      crearOferta({ id: 8 }),
      crearOferta({ id: 9 }),
      crearOferta({ id: 10 }),
    ];
    ofertasService.listarDelCliente.mockReturnValue(of(ofertas));
    ofertasService.comparar.mockReturnValue(of(ofertas.slice(0, 2)));

    const fixture = crear('PUBLICADA');
    const casillas = casillasComparar(fixture);
    expect(casillas).toHaveLength(4);

    casillas[0]?.click();
    casillas[1]?.click();
    casillas[2]?.click();
    fixture.detectChanges();

    expect(casillas[3]?.disabled).toBe(true);
    expect(contenido(fixture)).toContain('3 de 3 seleccionadas');

    pulsarBoton(fixture, 'Comparar seleccionadas');

    expect(ofertasService.comparar).toHaveBeenCalledWith(15, [7, 8, 9]);
    expect(dialogo.open).toHaveBeenCalled();
  });

  it('inicia una contraoferta y registra la respuesta sin crear servicio', () => {
    const oferta = crearOferta({ estado: 'ENVIADA' });
    const actualizada = crearOferta({
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'CLIENTE', montoPropuesto: 130 })],
    });
    const respuesta: ContraofertaRequest = {
      accion: 'CONTRAOFERTA',
      montoPropuesto: 130,
      mensaje: 'Puedo pagar 130.',
    };
    ofertasService.listarDelCliente.mockReturnValue(of([oferta]));
    ofertasService.responder.mockReturnValue(of({ oferta: actualizada, servicio: null }));
    dialogo.open.mockReturnValue({ afterClosed: () => of(respuesta) });

    const fixture = crear('PUBLICADA');
    const emitidos: number[] = [];
    fixture.componentInstance.servicioCreado.subscribe((id) => emitidos.push(id));

    pulsarBoton(fixture, 'Hacer contraoferta');

    expect(ofertasService.responder).toHaveBeenCalledWith(7, respuesta);
    expect(notificaciones.exito).toHaveBeenCalledWith('Respuesta de negociación registrada.');
    expect(emitidos).toHaveLength(0);
  });

  it('acepta la contraoferta del técnico y notifica la creación del servicio', () => {
    const oferta = crearOferta({
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'TECNICO', montoPropuesto: 140 })],
    });
    const aceptada = crearOferta({
      estado: 'ACEPTADA',
      servicioId: 21,
      precioServicio: 140,
      precioTotal: 150,
      contraofertas: [
        crearContraoferta({ emisor: 'TECNICO', montoPropuesto: 140, estado: 'ACEPTADA' }),
      ],
    });
    const respuesta: ContraofertaRequest = {
      accion: 'ACEPTAR',
      montoPropuesto: null,
      mensaje: null,
    };
    ofertasService.listarDelCliente.mockReturnValueOnce(of([oferta]));
    ofertasService.listarDelCliente.mockReturnValue(of([aceptada]));
    ofertasService.responder.mockReturnValue(of({ oferta: aceptada, servicio: SERVICIO }));
    dialogo.open.mockReturnValue({ afterClosed: () => of(respuesta) });

    const fixture = crear('PUBLICADA');
    const emitidos: number[] = [];
    fixture.componentInstance.servicioCreado.subscribe((id) => emitidos.push(id));

    pulsarBoton(fixture, 'Responder contraoferta');

    expect(ofertasService.responder).toHaveBeenCalledWith(7, respuesta);
    expect(emitidos).toEqual([21]);
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Servicio creado. El técnico fue notificado y el resto de ofertas se cerró.',
    );
    expect(contenido(fixture)).toContain('El servicio ya fue confirmado');
  });

  it('acepta una oferta directamente y navega al servicio creado', () => {
    ofertasService.listarDelCliente.mockReturnValue(of([crearOferta({ id: 7 })]));
    ofertasService.aceptar.mockReturnValue(of(SERVICIO));
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });

    const fixture = crear('PUBLICADA');
    const emitidos: number[] = [];
    fixture.componentInstance.servicioCreado.subscribe((id) => emitidos.push(id));

    pulsarBoton(fixture, 'Aceptar oferta');

    expect(ofertasService.aceptar).toHaveBeenCalledWith(7);
    expect(emitidos).toEqual([21]);
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Oferta aceptada. El servicio fue creado y el técnico fue notificado.',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/app/cliente/servicios', 21]);
  });

  it('no muestra el botón de aceptar si hay una contraoferta pendiente', () => {
    ofertasService.listarDelCliente.mockReturnValue(
      of([
        crearOferta({
          id: 7,
          estado: 'CONTRAOFERTADA',
          contraofertas: [crearContraoferta({ emisor: 'TECNICO', montoPropuesto: 140 })],
        }),
      ]),
    );

    const fixture = crear('PUBLICADA');

    expect(contenido(fixture)).toContain('Responder contraoferta');
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).some((boton) =>
        boton.textContent?.includes('Aceptar oferta'),
      ),
    ).toBe(false);
  });

  it('avisa que la solicitud ya no admite negociación', () => {
    ofertasService.listarDelCliente.mockReturnValue(of([crearOferta({ estado: 'ENVIADA' })]));

    const fixture = crear('CANCELADA');

    expect(contenido(fixture)).toContain('La solicitud ya no admite negociación');
    expect(contenido(fixture)).not.toContain('Hacer contraoferta');
  });

  function crear(estado: EstadoSolicitud): ComponentFixture<OfertasRecibidas> {
    const fixture = TestBed.createComponent(OfertasRecibidas);
    fixture.componentRef.setInput('solicitudId', 15);
    fixture.componentRef.setInput('estadoSolicitud', estado);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<OfertasRecibidas>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function casillasComparar(fixture: ComponentFixture<OfertasRecibidas>): HTMLInputElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'article.oferta-recibida input[type="checkbox"]',
    ),
  );
}

function pulsarBoton(fixture: ComponentFixture<OfertasRecibidas>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
