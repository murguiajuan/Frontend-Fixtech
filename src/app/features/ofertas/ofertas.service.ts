import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ContraofertaRequest,
  Oferta,
  OfertaOrden,
  OfertaRequest,
  RespuestaNegociacion,
} from './oferta.models';

@Service()
export class OfertasService {
  private readonly http = inject(HttpClient);

  crear(solicitudId: number, request: OfertaRequest): Observable<Oferta> {
    return this.http.post<Oferta>(
      `${environment.apiUrl}/solicitudes/${solicitudId}/ofertas`,
      request,
    );
  }

  actualizar(ofertaId: number, request: OfertaRequest): Observable<Oferta> {
    return this.http.put<Oferta>(`${environment.apiUrl}/ofertas/${ofertaId}`, request);
  }

  retirar(ofertaId: number): Observable<Oferta> {
    return this.http.delete<Oferta>(`${environment.apiUrl}/ofertas/${ofertaId}`);
  }

  listarMias(): Observable<readonly Oferta[]> {
    return this.http.get<readonly Oferta[]>(`${environment.apiUrl}/ofertas/mias`);
  }

  listarDelCliente(solicitudId: number, orden: OfertaOrden): Observable<readonly Oferta[]> {
    return this.http.get<readonly Oferta[]>(
      `${environment.apiUrl}/solicitudes/${solicitudId}/ofertas`,
      { params: { orden } },
    );
  }

  comparar(solicitudId: number, ofertaIds: readonly number[]): Observable<readonly Oferta[]> {
    let params = new HttpParams();
    ofertaIds.forEach((id) => {
      params = params.append('ids', id);
    });
    return this.http.get<readonly Oferta[]>(
      `${environment.apiUrl}/solicitudes/${solicitudId}/ofertas/comparar`,
      { params },
    );
  }

  responder(ofertaId: number, request: ContraofertaRequest): Observable<RespuestaNegociacion> {
    return this.http.post<RespuestaNegociacion>(
      `${environment.apiUrl}/ofertas/${ofertaId}/contraoferta`,
      request,
    );
  }
}
