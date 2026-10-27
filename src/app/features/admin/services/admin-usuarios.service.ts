import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CambioEstadoUsuarioRequest, FiltrosUsuarios, UsuarioAdmin } from '../admin.models';

@Service()
export class AdminUsuariosService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosUsuarios): Observable<readonly UsuarioAdmin[]> {
    let params = new HttpParams();
    if (filtros.rol !== 'TODOS') {
      params = params.set('rol', filtros.rol);
    }
    if (filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }
    const busqueda = filtros.busqueda.trim();
    if (busqueda !== '') {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get<readonly UsuarioAdmin[]>(`${environment.apiUrl}/admin/usuarios`, {
      params,
    });
  }

  cambiarEstado(usuarioId: number, request: CambioEstadoUsuarioRequest): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(
      `${environment.apiUrl}/admin/usuarios/${usuarioId}/estado`,
      request,
    );
  }
}
