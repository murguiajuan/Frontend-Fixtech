import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminAuditoriaService } from './admin-auditoria.service';

describe('AdminAuditoriaService', () => {
  let servicio: AdminAuditoriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminAuditoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('envía todos los filtros normalizados y la paginación', () => {
    servicio
      .listar({
        usuarioId: 7,
        entidad: '  servicio  ',
        accion: '  actualizar_estado  ',
        desde: '2026-10-01',
        hasta: '2026-10-27',
        pagina: 2,
        tamano: 50,
      })
      .subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/auditoria`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('usuarioId')).toBe('7');
    expect(peticion.request.params.get('entidad')).toBe('servicio');
    expect(peticion.request.params.get('accion')).toBe('actualizar_estado');
    expect(peticion.request.params.get('desde')).toBe('2026-10-01');
    expect(peticion.request.params.get('hasta')).toBe('2026-10-27');
    expect(peticion.request.params.get('pagina')).toBe('2');
    expect(peticion.request.params.get('tamano')).toBe('50');
    peticion.flush({
      contenido: [],
      pagina: 2,
      tamano: 50,
      totalElementos: 0,
      totalPaginas: 0,
    });
  });

  it('omite los filtros vacíos y los extremos de fecha no informados', () => {
    servicio
      .listar({
        usuarioId: null,
        entidad: '   ',
        accion: '',
        desde: '',
        hasta: '2026-10-27',
        pagina: 0,
        tamano: 20,
      })
      .subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/auditoria`,
    );
    expect(peticion.request.params.has('usuarioId')).toBe(false);
    expect(peticion.request.params.has('entidad')).toBe(false);
    expect(peticion.request.params.has('accion')).toBe(false);
    expect(peticion.request.params.has('desde')).toBe(false);
    expect(peticion.request.params.get('hasta')).toBe('2026-10-27');
    expect(peticion.request.params.get('pagina')).toBe('0');
    expect(peticion.request.params.get('tamano')).toBe('20');
    peticion.flush({
      contenido: [],
      pagina: 0,
      tamano: 20,
      totalElementos: 0,
      totalPaginas: 0,
    });
  });
});
