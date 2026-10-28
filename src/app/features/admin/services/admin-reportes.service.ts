import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardAdmin, FiltrosReporte, ReporteAdmin } from '../reportes/reportes.models';

@Service()
export class AdminReportesService {
  private readonly http = inject(HttpClient);

  obtenerDashboard(): Observable<DashboardAdmin> {
    return this.http.get<DashboardAdmin>(`${environment.apiUrl}/admin/dashboard`);
  }

  obtenerReporte(filtros: FiltrosReporte): Observable<ReporteAdmin> {
    return this.http.get<ReporteAdmin>(`${environment.apiUrl}/admin/reportes`, {
      params: this.parametros(filtros),
    });
  }

  exportarExcel(filtros: FiltrosReporte): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/admin/reportes/excel`, {
      params: this.parametros(filtros),
      observe: 'response',
      responseType: 'blob',
    });
  }

  private parametros(filtros: FiltrosReporte): HttpParams {
    return new HttpParams().set('desde', filtros.desde).set('hasta', filtros.hasta);
  }
}
