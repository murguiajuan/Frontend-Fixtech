import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminTecnicosService } from './admin-tecnicos.service';

describe('AdminTecnicosService', () => {
  let servicio: AdminTecnicosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminTecnicosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('envía el estado y la búsqueda normalizada', () => {
    servicio.listar({ estadoVerificacion: 'OBSERVADO', busqueda: '  Ana Torres  ' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/tecnicos`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('estadoVerificacion')).toBe('OBSERVADO');
    expect(peticion.request.params.get('busqueda')).toBe('Ana Torres');
    peticion.flush([]);
  });

  it('omite los filtros vacíos', () => {
    servicio.listar({ estadoVerificacion: 'TODOS', busqueda: '   ' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/tecnicos`,
    );
    expect(peticion.request.params.has('estadoVerificacion')).toBe(false);
    expect(peticion.request.params.has('busqueda')).toBe(false);
    peticion.flush([]);
  });

  it('verifica usando el id del técnico y el motivo indicado', () => {
    servicio
      .verificar(42, { estado: 'RECHAZADO', motivo: 'El DNI no coincide con el nombre.' })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/tecnicos/42/verificacion`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'RECHAZADO',
      motivo: 'El DNI no coincide con el nombre.',
    });
    peticion.flush({
      id: 42,
      estadoVerificacion: 'RECHAZADO',
      motivoVerificacion: 'El DNI no coincide con el nombre.',
      fechaVerificacion: '2026-10-27T12:00:00',
    });
  });

  it('envía motivo nulo al aprobar', () => {
    servicio.verificar(7, { estado: 'APROBADO', motivo: null }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/tecnicos/7/verificacion`);
    expect(peticion.request.body).toEqual({ estado: 'APROBADO', motivo: null });
    peticion.flush({
      id: 7,
      estadoVerificacion: 'APROBADO',
      motivoVerificacion: null,
      fechaVerificacion: '2026-10-27T12:00:00',
    });
  });
});
