import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SolicitudDisponible } from '../../ofertas/oferta.models';

@Service()
export class SolicitudesDisponiblesService {
  private readonly http = inject(HttpClient);

  listar(): Observable<readonly SolicitudDisponible[]> {
    return this.http.get<readonly SolicitudDisponible[]>(
      `${environment.apiUrl}/solicitudes/disponibles`,
    );
  }

  obtener(id: number): Observable<SolicitudDisponible> {
    return this.http.get<SolicitudDisponible>(
      `${environment.apiUrl}/solicitudes/disponibles/${id}`,
    );
  }
}
