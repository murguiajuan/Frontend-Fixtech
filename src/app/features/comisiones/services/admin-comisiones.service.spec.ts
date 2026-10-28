import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { crearDeuda, crearPago } from '../testing/comision.fixtures';
import { AdminComisionesService } from './admin-comisiones.service';

describe('AdminComisionesService', () => {
  let servicio: AdminComisionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminComisionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('omite el parámetro de estado cuando el filtro es TODOS', () => {
    servicio.listarPagos({ estado: 'TODOS' }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/pagos`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([]);
  });

  it('envía el estado del pago al administrador', () => {
    servicio.listarPagos({ estado: 'PENDIENTE' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/pagos`,
    );
    expect(peticion.request.params.get('estado')).toBe('PENDIENTE');
    peticion.flush([]);
  });

  it('valida o rechaza un pago con su observación', () => {
    servicio
      .validarPago(51, { estado: 'RECHAZADO', observacion: 'El comprobante no coincide.' })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/pagos/51/validacion`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'RECHAZADO',
      observacion: 'El comprobante no coincide.',
    });
    peticion.flush(crearPago({ estado: 'RECHAZADO' }));
  });

  it('lista los deudores de comisiones', () => {
    servicio.listarDeudores().subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/comisiones/deudores`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([crearDeuda()]);
  });

  it('expone la ruta administrativa del comprobante', () => {
    expect(servicio.urlComprobante(51)).toBe('/api/admin/pagos/51/comprobante');
  });
});
