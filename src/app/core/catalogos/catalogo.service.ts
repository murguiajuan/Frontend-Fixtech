import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogoSimple, DistritoCatalogo, EspecialidadCatalogo } from './catalogo.models';

@Service()
export class CatalogoService {
  private readonly http = inject(HttpClient);

  listarTiposEquipo(): Observable<readonly CatalogoSimple[]> {
    return this.http.get<readonly CatalogoSimple[]>(`${environment.apiUrl}/catalogos/tipos-equipo`);
  }

  listarTiposServicio(): Observable<readonly CatalogoSimple[]> {
    return this.http.get<readonly CatalogoSimple[]>(
      `${environment.apiUrl}/catalogos/tipos-servicio`,
    );
  }

  listarEspecialidades(): Observable<readonly EspecialidadCatalogo[]> {
    return this.http.get<readonly EspecialidadCatalogo[]>(
      `${environment.apiUrl}/catalogos/especialidades`,
    );
  }

  listarDistritos(): Observable<readonly DistritoCatalogo[]> {
    return this.http.get<readonly DistritoCatalogo[]>(`${environment.apiUrl}/catalogos/distritos`);
  }
}
