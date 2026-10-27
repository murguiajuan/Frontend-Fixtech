import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FiltrosTecnicos,
  TecnicoAdmin,
  TecnicoVerificacionResponse,
  VerificacionTecnicoRequest,
} from '../admin.models';

@Service()
export class AdminTecnicosService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosTecnicos): Observable<readonly TecnicoAdmin[]> {
    let params = new HttpParams();
    if (filtros.estadoVerificacion !== 'TODOS') {
      params = params.set('estadoVerificacion', filtros.estadoVerificacion);
    }
    const busqueda = filtros.busqueda.trim();
    if (busqueda !== '') {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get<readonly TecnicoAdmin[]>(`${environment.apiUrl}/admin/tecnicos`, {
      params,
    });
  }

  verificar(
    tecnicoId: number,
    request: VerificacionTecnicoRequest,
  ): Observable<TecnicoVerificacionResponse> {
    return this.http.patch<TecnicoVerificacionResponse>(
      `${environment.apiUrl}/admin/tecnicos/${tecnicoId}/verificacion`,
      request,
    );
  }
}
