import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EstadoResena, Resena } from '../../servicios/servicio.models';
import { FiltrosResenas } from '../admin.models';

@Service()
export class AdminResenasService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosResenas): Observable<readonly Resena[]> {
    let params = new HttpParams();
    if (filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }
    return this.http.get<readonly Resena[]>(`${environment.apiUrl}/admin/resenas`, { params });
  }

  moderar(
    resenaId: number,
    estado: Extract<EstadoResena, 'VISIBLE' | 'OCULTA'>,
  ): Observable<Resena> {
    return this.http.patch<Resena>(`${environment.apiUrl}/admin/resenas/${resenaId}/moderacion`, {
      estado,
    });
  }
}
