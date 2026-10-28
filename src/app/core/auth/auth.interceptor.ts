import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../auth/session-store.service';
import { TokenRefreshService } from '../auth/token-refresh.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const refresh = inject(TokenRefreshService);
  const esApi = request.url.startsWith(environment.apiUrl);
  const esRutaPublica = esRutaDeAutenticacionPublica(request.url);
  const token = session.accessToken();

  const solicitud =
    token === null || !esApi || esRutaPublica
      ? request
      : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(solicitud).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        esRutaPublica ||
        !esApi
      ) {
        return throwError(() => error);
      }
      return refresh.refrescar().pipe(
        catchError((errorRefresco: unknown) => {
          session.limpiar();
          return throwError(() => errorRefresco);
        }),
        switchMap((nuevoToken) =>
          next(
            solicitud.clone({
              setHeaders: { Authorization: `Bearer ${nuevoToken}` },
            }),
          ),
        ),
      );
    }),
  );
};

function esRutaDeAutenticacionPublica(url: string): boolean {
  return (
    url.startsWith(`${environment.apiUrl}/auth/login`) ||
    url.startsWith(`${environment.apiUrl}/auth/refresh`) ||
    url.startsWith(`${environment.apiUrl}/auth/register/`) ||
    url.startsWith(`${environment.apiUrl}/auth/recuperacion/`)
  );
}
