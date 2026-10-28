import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { normalizarError } from './api-error';
import { SILENCIAR_ERROR } from './silenciar-error';
import { NotificacionService } from '../../shared/ui/notificacion.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificaciones = inject(NotificacionService);
  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = normalizarError(error);
      const esRutaDeAutenticacion = request.url.startsWith(`${environment.apiUrl}/auth/`);
      if (
        !request.context.get(SILENCIAR_ERROR) &&
        !esRutaDeAutenticacion &&
        (apiError.estado === 0 || apiError.estado >= 500)
      ) {
        notificaciones.error(apiError.mensaje);
      }
      return throwError(() => apiError);
    }),
  );
};
