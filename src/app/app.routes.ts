import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { PublicLayout } from './core/layout/public-layout/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
      {
        path: 'login',
        title: 'Iniciar sesión | FIXTECH',
        loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'registro',
        title: 'Crear cuenta | FIXTECH',
        loadComponent: () =>
          import('./features/auth/registro-cliente/registro-cliente.page').then(
            (m) => m.RegistroClientePage,
          ),
      },
    ],
  },
  {
    path: 'app',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio',
      },
      {
        path: 'inicio',
        title: 'Inicio | FIXTECH',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
    ],
  },
  {
    path: 'no-autorizado',
    title: 'Acceso no autorizado | FIXTECH',
    loadComponent: () =>
      import('./features/errors/no-autorizado.page').then((m) => m.NoAutorizadoPage),
  },
  {
    path: '**',
    title: 'Página no encontrada | FIXTECH',
    loadComponent: () =>
      import('./features/errors/no-encontrado.page').then((m) => m.NoEncontradoPage),
  },
];
