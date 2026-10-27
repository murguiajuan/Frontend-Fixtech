import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.asegurarSesion().pipe(
    map((sesionValida) =>
      sesionValida
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .asegurarSesion()
    .pipe(map((sesionValida) => (sesionValida ? router.createUrlTree(['/app']) : true)));
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = route.data['roles'] as readonly string[] | undefined;
  return auth.asegurarSesion().pipe(
    map((sesionValida) => {
      if (!sesionValida) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
      }
      const rol = auth.rol();
      if (rol === null) {
        return router.createUrlTree(['/login']);
      }
      return rolesPermitidos === undefined || rolesPermitidos.includes(rol)
        ? true
        : router.createUrlTree(['/no-autorizado']);
    }),
  );
};

export const tecnicoAprobadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.asegurarSesion().pipe(
    map((sesionValida) => {
      if (!sesionValida) {
        return router.createUrlTree(['/login']);
      }
      if (auth.rol() !== 'TECNICO' || auth.esTecnicoAprobado()) {
        return true;
      }
      return router.createUrlTree(['/app/inicio'], {
        queryParams: { verificacion: 'pendiente' },
      });
    }),
  );
};
