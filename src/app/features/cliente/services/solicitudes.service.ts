import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EstadoSolicitud,
  SolicitudDetalle,
  SolicitudRequest,
  SolicitudResumen,
} from '../solicitudes/solicitud.models';

@Service()
export class SolicitudesService {
  private readonly http = inject(HttpClient);

  listarMias(estado?: EstadoSolicitud): Observable<readonly SolicitudResumen[]> {
    const params = estado === undefined ? undefined : { estado };
    return this.http.get<readonly SolicitudResumen[]>(
      `${environment.apiUrl}/solicitudes/mias`,
      params === undefined ? {} : { params },
    );
  }

  obtener(id: number): Observable<SolicitudDetalle> {
    return this.http.get<SolicitudDetalle>(`${environment.apiUrl}/solicitudes/${id}`);
  }

  crear(datos: SolicitudRequest, fotos: readonly File[]): Observable<SolicitudDetalle> {
    const cuerpo = new FormData();
    cuerpo.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    fotos.forEach((foto) => cuerpo.append('fotos', foto, foto.name));
    return this.http.post<SolicitudDetalle>(`${environment.apiUrl}/solicitudes`, cuerpo);
  }

  actualizar(id: number, datos: SolicitudRequest): Observable<SolicitudDetalle> {
    return this.http.put<SolicitudDetalle>(`${environment.apiUrl}/solicitudes/${id}`, datos);
  }

  cancelar(id: number, motivo: string | null): Observable<SolicitudDetalle> {
    let params = new HttpParams();
    const motivoNormalizado = motivo?.trim() ?? '';
    if (motivoNormalizado !== '') {
      params = params.set('motivo', motivoNormalizado);
    }
    return this.http.delete<SolicitudDetalle>(`${environment.apiUrl}/solicitudes/${id}`, {
      params,
    });
  }
}
