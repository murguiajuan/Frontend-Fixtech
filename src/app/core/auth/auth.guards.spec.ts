import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  GuardResult,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Rol } from './auth.models';
import { authGuard, guestGuard, roleGuard, tecnicoAprobadoGuard } from './auth.guards';

class AuthStub {
  readonly asegurarSesion = vi.fn();
  readonly rol = vi.fn();
  readonly esTecnicoAprobado = vi.fn();
}

describe('Auth guards', () => {
  let auth: AuthStub;

  beforeEach(() => {
    auth = new AuthStub();
    auth.asegurarSesion.mockReturnValue(of(true));
    auth.rol.mockReturnValue('CLIENTE' satisfies Rol);
    auth.esTecnicoAprobado.mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  it('permite el acceso cuando hay una sesión válida', async () => {
    const resultado = await ejecutarGuard(authGuard);

    expect(resultado).toBe(true);
  });

  it('redirige al login cuando no hay sesión', async () => {
    auth.asegurarSesion.mockReturnValue(of(false));

    const resultado = await ejecutarGuard(authGuard);

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain('/login');
  });

  it('redirige al panel cuando un usuario autenticado visita el login', async () => {
    const resultado = await ejecutarGuard(guestGuard);

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain('/app');
  });

  it('permite el acceso a un rol autorizado', async () => {
    const resultado = await ejecutarGuard(roleGuard, { roles: ['CLIENTE'] });

    expect(resultado).toBe(true);
  });

  it('redirige a no autorizado cuando el rol no coincide', async () => {
    const resultado = await ejecutarGuard(roleGuard, { roles: ['ADMIN'] });

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain('/no-autorizado');
  });

  it('bloquea las rutas de ofertas de un técnico pendiente', async () => {
    auth.rol.mockReturnValue('TECNICO');
    auth.esTecnicoAprobado.mockReturnValue(false);

    const resultado = await ejecutarGuard(tecnicoAprobadoGuard);

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toContain('/app/inicio');
  });

  it('permite las rutas de ofertas de un técnico aprobado', async () => {
    auth.rol.mockReturnValue('TECNICO');
    auth.esTecnicoAprobado.mockReturnValue(true);

    const resultado = await ejecutarGuard(tecnicoAprobadoGuard);

    expect(resultado).toBe(true);
  });
});

async function ejecutarGuard(
  guard: CanActivateFn,
  data: Record<string, unknown> = {},
): Promise<GuardResult> {
  const route = { data } as unknown as ActivatedRouteSnapshot;
  const state = { url: '/app/inicio' } as RouterStateSnapshot;
  const resultado$ = TestBed.runInInjectionContext(() =>
    guard(route, state),
  ) as Observable<GuardResult>;
  return firstValueFrom(resultado$);
}
