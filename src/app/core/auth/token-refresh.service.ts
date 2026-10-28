import { HttpClient, HttpBackend } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenResponse } from './auth.models';
import { SesionExpiradaService } from './sesion-expirada.service';
import { SessionStore } from './session-store.service';

/**
 * Renueva el par de tokens sin pasar por los interceptores de la aplicación.
 * Se usa HttpBackend para evitar una dependencia circular con HttpClient.
 */
@Service()
export class TokenRefreshService {
  private readonly backend = inject(HttpBackend);
  private readonly session = inject(SessionStore);
  private readonly sesionExpirada = inject(SesionExpiradaService);
  private refresco$: Observable<string> | null = null;

  refrescar(): Observable<string> {
    const refreshToken = this.session.refreshToken();
    if (refreshToken === null) {
      this.sesionExpirada.marcarExpirada();
      return throwError(() => new Error('No hay refresh token disponible'));
    }
    if (this.refresco$ === null) {
      const http = new HttpClient(this.backend);
      this.refresco$ = http
        .post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
        .pipe(
          tap((tokens) => this.session.guardar(tokens)),
          map((tokens) => tokens.accessToken),
          catchError((error: unknown) => {
            this.sesionExpirada.marcarExpirada();
            this.session.limpiar();
            return throwError(() => error);
          }),
          finalize(() => {
            this.refresco$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refresco$;
  }
}
