import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { ContraofertaRequest } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import {
  crearContraoferta,
  crearOferta,
  crearSolicitudDisponible,
} from '../../../ofertas/testing/oferta.fixtures';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';
import { SolicitudDisponiblePage } from './solicitud-disponible.page';

describe('SolicitudDisponiblePage', () => {
  const solicitudesService = { listar: vi.fn(), obtener: vi.fn() };
  const ofertasService = {
    listarMias: vi.fn(),
    retirar: vi.fn(),
    responder: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    solicitudesService.obtener.mockReset();
    solicitudesService.obtener.mockReturnValue(of(crearSolicitudDisponible()));
    ofertasService.listarMias.mockReset();
    ofertasService.listarMias.mockReturnValue(of([]));
    ofertasService.retirar.mockReset();
    ofertasService.responder.mockReset();
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [SolicitudDisponiblePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SolicitudesDisponiblesService, useValue: solicitudesService },
        { provide: OfertasService, useValue: ofertasService },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el detalle de la solicitud y la oferta existente', () => {
    ofertasService.listarMias.mockReturnValue(of([crearOferta({ solicitudId: 15 })]));

    const fixture = crear('15');
    const texto = contenido(fixture);

    expect(texto).toContain('Solicitud #15');
    expect(texto).toContain('Laptop · Diagnóstico y reparación');
    expect(texto).toContain('La laptop no enciende');
    expect(texto).toContain('Piura');
    expect(texto).toContain('S/ 180.00');
    expect(texto).toContain('Tu oferta');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('El total suma servicio y movilidad');
    expect(texto).toContain('Editar oferta');
    expect(texto).toContain('Retirar oferta');
    expect(texto).toContain('Aún no hay contraofertas');
  });

  it('invita a enviar una oferta cuando todavía no existe', () => {
    const fixture = crear('15');

    expect(contenido(fixture)).toContain('Aún no has enviado una oferta');
    expect(contenido(fixture)).toContain('Enviar oferta');
  });

  it('muestra el error y permite reintentar la carga', () => {
    solicitudesService.obtener.mockReturnValueOnce(
      throwError(() => ({
        estado: 403,
        mensaje: 'La solicitud ya no está disponible',
        detalles: [],
      })),
    );
    solicitudesService.obtener.mockReturnValue(of(crearSolicitudDisponible()));

    const fixture = crear('15');
    expect(contenido(fixture)).toContain('No pudimos cargar esta solicitud');
    expect(contenido(fixture)).toContain('La solicitud ya no está disponible');

    pulsarBoton(fixture, 'Reintentar');

    expect(contenido(fixture)).toContain('Laptop · Diagnóstico y reparación');
  });

  it('rechaza un identificador inválido sin consultar la API', () => {
    const fixture = crear('abc');

    expect(contenido(fixture)).toContain('La solicitud indicada no es válida');
    expect(solicitudesService.obtener).not.toHaveBeenCalled();
  });

  it('retira la oferta tras confirmar el diálogo', () => {
    const oferta = crearOferta({ solicitudId: 15 });
    const retirada = crearOferta({ solicitudId: 15, estado: 'RETIRADA' });
    ofertasService.listarMias.mockReturnValue(of([oferta]));
    ofertasService.retirar.mockReturnValue(of(retirada));
    dialogo.open.mockReturnValue({ afterClosed: () => of(true) });

    const fixture = crear('15');
    pulsarBoton(fixture, 'Retirar oferta');

    expect(ofertasService.retirar).toHaveBeenCalledWith(7);
    expect(notificaciones.exito).toHaveBeenCalledWith('Oferta retirada.');
    expect(contenido(fixture)).toContain('Esta oferta ya no está activa');
  });

  it('responde una contraoferta del cliente desde el detalle', () => {
    const oferta = crearOferta({
      solicitudId: 15,
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'CLIENTE', montoPropuesto: 140 })],
    });
    const actualizada = crearOferta({
      solicitudId: 15,
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

    const fixture = crear('15');
    expect(contenido(fixture)).toContain('El cliente envió una contraoferta');

    pulsarBoton(fixture, 'Responder contraoferta');

    expect(ofertasService.responder).toHaveBeenCalledWith(7, respuesta);
    expect(notificaciones.exito).toHaveBeenCalledWith('Respuesta de negociación registrada.');
    expect(contenido(fixture)).toContain('S/ 150.00');
  });

  function crear(id: string | undefined): ComponentFixture<SolicitudDisponiblePage> {
    const fixture = TestBed.createComponent(SolicitudDisponiblePage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<SolicitudDisponiblePage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(fixture: ComponentFixture<SolicitudDisponiblePage>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
