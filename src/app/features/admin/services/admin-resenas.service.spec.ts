import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminResenasService } from './admin-resenas.service';

describe('AdminResenasService', () => {
  let servicio: AdminResenasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminResenasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista las reseñas sin filtro de estado', () => {
    servicio.listar({ estado: 'TODOS' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/resenas`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([]);
  });

  it('lista las reseñas filtrando por estado', () => {
    servicio.listar({ estado: 'REPORTADA' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/resenas`,
    );
    expect(peticion.request.params.get('estado')).toBe('REPORTADA');
    peticion.flush([]);
  });

  it('modera una reseña con el estado indicado', () => {
    servicio.moderar(41, 'OCULTA').subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/resenas/41/moderacion`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'OCULTA' });
    peticion.flush({});
  });
});
