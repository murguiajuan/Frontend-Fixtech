import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { crearPago, crearSaldo } from '../testing/comision.fixtures';
import { ComisionesService } from './comisiones.service';

describe('ComisionesService', () => {
  let servicio: ComisionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ComisionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene el saldo del técnico autenticado', () => {
    servicio.obtenerMiSaldo().subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/comisiones/mi-saldo`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(crearSaldo());
  });

  it('lista los pagos sin filtro y envía el estado cuando se indica', () => {
    servicio.listarPagos().subscribe();
    const sinFiltro = http.expectOne(`${environment.apiUrl}/comisiones/pagos`);
    expect(sinFiltro.request.params.has('estado')).toBe(false);
    sinFiltro.flush([]);

    servicio.listarPagos('RECHAZADO').subscribe();
    const conFiltro = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/comisiones/pagos`,
    );
    expect(conFiltro.request.params.get('estado')).toBe('RECHAZADO');
    conFiltro.flush([]);
  });

  it('registra el pago multipart con las comisiones y el comprobante', () => {
    const comprobante = new File(['imagen'], 'comprobante.png', { type: 'image/png' });
    servicio
      .registrarPago({
        comisionIds: [101, 102],
        metodo: 'YAPE',
        numeroOperacion: '  OP-2026-001  ',
        comprobante,
      })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/comisiones/pagos`);
    expect(peticion.request.method).toBe('POST');
    const datos = peticion.request.body as FormData;
    expect(datos).toBeInstanceOf(FormData);
    expect(datos.getAll('comisionIds')).toEqual(['101', '102']);
    expect(datos.get('metodo')).toBe('YAPE');
    expect(datos.get('numeroOperacion')).toBe('OP-2026-001');
    const archivo = datos.get('comprobante');
    expect(archivo).toBeInstanceOf(File);
    expect((archivo as File).name).toBe('comprobante.png');
    peticion.flush(crearPago());
  });

  it('expone la ruta autenticada del comprobante', () => {
    expect(servicio.urlComprobante(51)).toBe('/api/comisiones/pagos/51/comprobante');
  });
});
