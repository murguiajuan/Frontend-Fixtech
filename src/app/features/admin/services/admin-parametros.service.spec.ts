import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminParametrosService } from './admin-parametros.service';

describe('AdminParametrosService', () => {
  let servicio: AdminParametrosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminParametrosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene la lista completa de parámetros', () => {
    servicio.listar().subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/parametros`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('envía únicamente los parámetros actualizados', () => {
    servicio
      .actualizar({
        parametros: [{ clave: 'comision_porcentaje', valor: '0.0700' }],
      })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/parametros`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({
      parametros: [{ clave: 'comision_porcentaje', valor: '0.0700' }],
    });
    peticion.flush([]);
  });
});
