import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ContraofertaRequest, OfertaRequest } from './oferta.models';
import { OfertasService } from './ofertas.service';
import { crearContraoferta, crearOferta } from './testing/oferta.fixtures';

const REQUEST: OfertaRequest = {
  modalidad: 'DOMICILIO',
  precioServicio: 150,
  costoMovilidad: 10,
  costoDiagnostico: 20,
  tiempoEstimadoHoras: 3,
  garantiaDias: 30,
  mensaje: 'Incluye limpieza interna.',
};

describe('OfertasService', () => {
  let servicio: OfertasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(OfertasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('crea una oferta para una solicitud', () => {
    const oferta = crearOferta();
    let resultado = oferta;

    servicio.crear(15, REQUEST).subscribe((respuesta) => {
      resultado = respuesta;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/15/ofertas`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(REQUEST);
    peticion.flush(oferta);

    expect(resultado).toEqual(oferta);
  });

  it('actualiza una oferta existente', () => {
    const oferta = crearOferta({ id: 8, precioServicio: 170, precioTotal: 180 });

    servicio.actualizar(8, REQUEST).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/ofertas/8`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual(REQUEST);
    peticion.flush(oferta);
  });

  it('retira una oferta', () => {
    const oferta = crearOferta({ estado: 'RETIRADA' });

    servicio.retirar(7).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/ofertas/7`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(oferta);
  });

  it('lista las ofertas del técnico autenticado', () => {
    const ofertas = [crearOferta()];

    servicio.listarMias().subscribe((respuesta) => {
      expect(respuesta).toEqual(ofertas);
    });

    const peticion = http.expectOne(`${environment.apiUrl}/ofertas/mias`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(ofertas);
  });

  it('lista las ofertas de una solicitud con el orden indicado', () => {
    const ofertas = [crearOferta()];

    servicio.listarDelCliente(15, 'CALIFICACION').subscribe();

    const peticion = http.expectOne(
      (solicitud) =>
        solicitud.url === `${environment.apiUrl}/solicitudes/15/ofertas` &&
        solicitud.params.get('orden') === 'CALIFICACION',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(ofertas);
  });

  it('compara ofertas enviando cada identificador como parámetro repetido', () => {
    const ofertas = [crearOferta({ id: 7 }), crearOferta({ id: 8 })];
    let resultado: readonly unknown[] = [];

    servicio.comparar(15, [7, 8]).subscribe((respuesta) => {
      resultado = respuesta;
    });

    const peticion = http.expectOne(
      (solicitud) =>
        solicitud.url === `${environment.apiUrl}/solicitudes/15/ofertas/comparar` &&
        solicitud.params.getAll('ids')?.join(',') === '7,8',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(ofertas);

    expect(resultado).toEqual(ofertas);
  });

  it('responde una contraoferta y devuelve el servicio cuando se crea', () => {
    const request: ContraofertaRequest = {
      accion: 'ACEPTAR',
      montoPropuesto: null,
      mensaje: null,
    };
    const oferta = crearOferta({ estado: 'ACEPTADA', servicioId: 21 });
    const respuesta = {
      oferta,
      servicio: {
        id: 21,
        solicitudId: 15,
        ofertaId: 7,
        clienteId: 2,
        tecnicoId: 9,
        modalidad: 'DOMICILIO' as const,
        estado: 'PROGRAMADO',
        precioServicio: 150,
        costoMovilidad: 10,
        costoDiagnostico: 20,
        montoTotal: 160,
        montoFinal: null,
        garantiaDias: 30,
        creadoEn: '2026-10-27T12:00:00',
      },
    };

    servicio.responder(7, request).subscribe((resultado) => {
      expect(resultado).toEqual(respuesta);
    });

    const peticion = http.expectOne(`${environment.apiUrl}/ofertas/7/contraoferta`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(request);
    peticion.flush(respuesta);
  });

  it('expone las contraofertas recibidas en la oferta', () => {
    const contraoferta = crearContraoferta();
    const oferta = crearOferta({ estado: 'CONTRAOFERTADA', contraofertas: [contraoferta] });

    servicio.listarMias().subscribe((respuesta) => {
      expect(respuesta[0]?.contraofertas[0]?.montoPropuesto).toBe(140);
    });

    http.expectOne(`${environment.apiUrl}/ofertas/mias`).flush([oferta]);
  });
});
