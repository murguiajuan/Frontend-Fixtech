import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CambioEstadoReclamoRequest, Reclamo } from '../../servicios/servicio.models';
import { FiltrosReclamos } from '../admin.models';

@Service()
export class AdminReclamosService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosReclamos): Observable<readonly Reclamo[]> {
    let params = new HttpParams();
    if (filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }
    return this.http.get<readonly Reclamo[]>(`${environment.apiUrl}/admin/reclamos`, { params });
  }

  obtener(reclamoId: number): Observable<Reclamo> {
    return this.http.get<Reclamo>(`${environment.apiUrl}/admin/reclamos/${reclamoId}`);
  }

  cambiarEstado(reclamoId: number, request: CambioEstadoReclamoRequest): Observable<Reclamo> {
    return this.http.patch<Reclamo>(
      `${environment.apiUrl}/admin/reclamos/${reclamoId}/estado`,
      request,
    );
  }

  urlFoto(reclamoId: number, fotoId: number): string {
    return `/api/admin/reclamos/${reclamoId}/fotos/${fotoId}`;
  }
}
