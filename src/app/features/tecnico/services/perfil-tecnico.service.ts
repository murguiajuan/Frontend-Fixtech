import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PerfilTecnicoRequest, PerfilUsuario } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Service()
export class PerfilTecnicoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  actualizarPerfil(request: PerfilTecnicoRequest): Observable<PerfilUsuario> {
    return this.http
      .put<PerfilUsuario>(`${environment.apiUrl}/perfil/tecnico`, request)
      .pipe(tap((perfil) => this.auth.actualizarPerfil(perfil)));
  }

  actualizarFoto(foto: File): Observable<PerfilUsuario> {
    const datos = new FormData();
    datos.append('foto', foto, foto.name);
    return this.http
      .post<PerfilUsuario>(`${environment.apiUrl}/perfil/foto`, datos)
      .pipe(tap((perfil) => this.auth.actualizarPerfil(perfil)));
  }
}
