import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminReclamosService } from './admin-reclamos.service';

describe('AdminReclamosService', () => {
  let servicio: AdminReclamosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminReclamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista los reclamos sin filtro de estado', () => {
    servicio.listar({ estado: 'TODOS' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/reclamos`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([]);
  });

  it('lista los reclamos filtrando por estado', () => {
    servicio.listar({ estado: 'EN_REVISION' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/reclamos`,
    );
    expect(peticion.request.params.get('estado')).toBe('EN_REVISION');
    peticion.flush([]);
  });

  it('obtiene el detalle del reclamo', () => {
    servicio.obtener(51).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/reclamos/51`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({});
  });

  it('cambia el estado del reclamo con su resolución', () => {
    servicio
      .cambiarEstado(51, { estado: 'RESUELTO', resolucion: 'Se reemplazó el repuesto.' })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/reclamos/51/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'RESUELTO',
      resolucion: 'Se reemplazó el repuesto.',
    });
    peticion.flush({});
  });

  it('construye la URL autenticada de las fotos', () => {
    expect(servicio.urlFoto(51, 201)).toBe('/api/admin/reclamos/51/fotos/201');
  });
});
