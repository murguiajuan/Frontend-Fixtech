import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FiltrosAuditoria, PaginaAuditoria } from '../auditoria/auditoria.models';

@Service()
export class AdminAuditoriaService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosAuditoria): Observable<PaginaAuditoria> {
    let params = new HttpParams().set('pagina', filtros.pagina).set('tamano', filtros.tamano);

    if (filtros.usuarioId !== null) {
      params = params.set('usuarioId', filtros.usuarioId);
    }
    const entidad = filtros.entidad.trim();
    if (entidad !== '') {
      params = params.set('entidad', entidad);
    }
    const accion = filtros.accion.trim();
    if (accion !== '') {
      params = params.set('accion', accion);
    }
    if (filtros.desde !== '') {
      params = params.set('desde', filtros.desde);
    }
    if (filtros.hasta !== '') {
      params = params.set('hasta', filtros.hasta);
    }

    return this.http.get<PaginaAuditoria>(`${environment.apiUrl}/admin/auditoria`, {
      params,
    });
  }
}
