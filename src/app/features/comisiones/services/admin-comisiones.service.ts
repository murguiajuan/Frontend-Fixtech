import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DeudaTecnico,
  FiltrosPagosComision,
  PagoComision,
  ValidacionPagoComisionRequest,
} from '../comision.models';

@Service()
export class AdminComisionesService {
  private readonly http = inject(HttpClient);

  listarPagos(filtros: FiltrosPagosComision): Observable<readonly PagoComision[]> {
    const params =
      filtros.estado === 'TODOS' ? undefined : new HttpParams().set('estado', filtros.estado);
    return this.http.get<readonly PagoComision[]>(`${environment.apiUrl}/admin/pagos`, { params });
  }

  validarPago(pagoId: number, request: ValidacionPagoComisionRequest): Observable<PagoComision> {
    return this.http.patch<PagoComision>(
      `${environment.apiUrl}/admin/pagos/${pagoId}/validacion`,
      request,
    );
  }

  listarDeudores(): Observable<readonly DeudaTecnico[]> {
    return this.http.get<readonly DeudaTecnico[]>(
      `${environment.apiUrl}/admin/comisiones/deudores`,
    );
  }

  urlComprobante(pagoId: number): string {
    return `/api/admin/pagos/${pagoId}/comprobante`;
  }
}
