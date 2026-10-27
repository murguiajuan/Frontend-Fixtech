import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DistritoCatalogo, EspecialidadCatalogo } from './catalogo.models';

@Service()
export class CatalogoService {
  private readonly http = inject(HttpClient);

  listarEspecialidades(): Observable<readonly EspecialidadCatalogo[]> {
    return this.http.get<readonly EspecialidadCatalogo[]>(
      `${environment.apiUrl}/catalogos/especialidades`,
    );
  }

  listarDistritos(): Observable<readonly DistritoCatalogo[]> {
    return this.http.get<readonly DistritoCatalogo[]>(`${environment.apiUrl}/catalogos/distritos`);
  }
}
