import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminReportesService } from './admin-reportes.service';

describe('AdminReportesService', () => {
  let servicio: AdminReportesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminReportesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene el dashboard administrativo', () => {
    servicio.obtenerDashboard().subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/dashboard`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({});
  });

  it('consulta el reporte con el rango de fechas', () => {
    servicio.obtenerReporte({ desde: '2026-10-01', hasta: '2026-10-27' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/reportes`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('desde')).toBe('2026-10-01');
    expect(peticion.request.params.get('hasta')).toBe('2026-10-27');
    peticion.flush({});
  });

  it('descarga el Excel autenticado como blob con el mismo rango', () => {
    let nombreCabecera: string | null = null;
    servicio.exportarExcel({ desde: '2026-09-01', hasta: '2026-09-30' }).subscribe((respuesta) => {
      nombreCabecera = respuesta.headers.get('Content-Disposition');
    });

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/reportes/excel`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('desde')).toBe('2026-09-01');
    expect(peticion.request.params.get('hasta')).toBe('2026-09-30');
    peticion.flush(new Blob(['excel']), {
      headers: {
        'Content-Disposition': 'attachment; filename="reporte.xlsx"',
      },
    });

    expect(nombreCabecera).toBe('attachment; filename="reporte.xlsx"');
  });
});
