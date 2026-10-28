import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EstadoPagoComision,
  MiSaldoComisiones,
  PagoComision,
  RegistrarPagoComisionRequest,
} from '../comision.models';

@Service()
export class ComisionesService {
  private readonly http = inject(HttpClient);

  obtenerMiSaldo(): Observable<MiSaldoComisiones> {
    return this.http.get<MiSaldoComisiones>(`${environment.apiUrl}/comisiones/mi-saldo`);
  }

  listarPagos(estado?: EstadoPagoComision): Observable<readonly PagoComision[]> {
    const params = estado === undefined ? undefined : new HttpParams().set('estado', estado);
    return this.http.get<readonly PagoComision[]>(`${environment.apiUrl}/comisiones/pagos`, {
      params,
    });
  }

  registrarPago(request: RegistrarPagoComisionRequest): Observable<PagoComision> {
    const datos = new FormData();
    for (const comisionId of request.comisionIds) {
      datos.append('comisionIds', String(comisionId));
    }
    datos.append('metodo', request.metodo);
    datos.append('numeroOperacion', request.numeroOperacion.trim());
    datos.append('comprobante', request.comprobante);
    return this.http.post<PagoComision>(`${environment.apiUrl}/comisiones/pagos`, datos);
  }

  urlComprobante(pagoId: number): string {
    return `/api/comisiones/pagos/${pagoId}/comprobante`;
  }
}
