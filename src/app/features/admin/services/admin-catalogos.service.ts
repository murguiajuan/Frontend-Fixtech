import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CatalogoAdmin,
  CatalogoAdminRequest,
  TipoCatalogoAdmin,
} from '../catalogos/catalogos-admin.models';

@Service()
export class AdminCatalogosService {
  private readonly http = inject(HttpClient);

  listar(tipo: TipoCatalogoAdmin, incluirInactivos: boolean): Observable<readonly CatalogoAdmin[]> {
    const params = new HttpParams().set('incluirInactivos', incluirInactivos);
    return this.http.get<readonly CatalogoAdmin[]>(
      `${environment.apiUrl}/admin/catalogos/${tipo}`,
      { params },
    );
  }

  crear(tipo: TipoCatalogoAdmin, request: CatalogoAdminRequest): Observable<CatalogoAdmin> {
    return this.http.post<CatalogoAdmin>(`${environment.apiUrl}/admin/catalogos/${tipo}`, request);
  }

  actualizar(
    tipo: TipoCatalogoAdmin,
    id: number,
    request: CatalogoAdminRequest,
  ): Observable<CatalogoAdmin> {
    return this.http.put<CatalogoAdmin>(
      `${environment.apiUrl}/admin/catalogos/${tipo}/${id}`,
      request,
    );
  }

  cambiarEstado(tipo: TipoCatalogoAdmin, id: number, activo: boolean): Observable<CatalogoAdmin> {
    return this.http.patch<CatalogoAdmin>(
      `${environment.apiUrl}/admin/catalogos/${tipo}/${id}/estado`,
      { activo },
    );
  }
}
