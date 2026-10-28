import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ParametroSistema, ParametrosUpdateRequest } from '../parametros/parametros.models';

@Service()
export class AdminParametrosService {
  private readonly http = inject(HttpClient);

  listar(): Observable<readonly ParametroSistema[]> {
    return this.http.get<readonly ParametroSistema[]>(`${environment.apiUrl}/admin/parametros`);
  }

  actualizar(request: ParametrosUpdateRequest): Observable<readonly ParametroSistema[]> {
    return this.http.put<readonly ParametroSistema[]>(
      `${environment.apiUrl}/admin/parametros`,
      request,
    );
  }
}
