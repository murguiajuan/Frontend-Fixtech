import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, tecnicoAprobadoGuard } from './core/auth/auth.guards';
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
      {
        path: 'registro-tecnico',
        title: 'Registro de técnico | FIXTECH',
        loadComponent: () =>
          import('./features/auth/registro-tecnico/registro-tecnico.page').then(
            (m) => m.RegistroTecnicoPage,
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
      {
        path: 'notificaciones',
        title: 'Notificaciones | FIXTECH',
        loadComponent: () =>
          import('./features/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage),
      },
      {
        path: 'perfil',
        title: 'Mi cuenta | FIXTECH',
        loadComponent: () => import('./features/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'cliente/solicitudes',
        title: 'Mis solicitudes | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/cliente/solicitudes/lista/solicitudes.page').then(
            (m) => m.SolicitudesPage,
          ),
      },
      {
        path: 'cliente/solicitudes/nueva',
        title: 'Nueva solicitud | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/cliente/solicitudes/formulario/solicitud-form.page').then(
            (m) => m.SolicitudFormPage,
          ),
      },
      {
        path: 'cliente/solicitudes/:id/editar',
        title: 'Editar solicitud | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/cliente/solicitudes/formulario/solicitud-form.page').then(
            (m) => m.SolicitudFormPage,
          ),
      },
      {
        path: 'cliente/solicitudes/:id',
        title: 'Detalle de solicitud | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/cliente/solicitudes/detalle/solicitud-detalle.page').then(
            (m) => m.SolicitudDetallePage,
          ),
      },
      {
        path: 'cliente/servicios',
        title: 'Mis servicios | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/servicios/lista/mis-servicios.page').then((m) => m.MisServiciosPage),
      },
      {
        path: 'cliente/servicios/:id',
        title: 'Detalle del servicio | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['CLIENTE'] },
        loadComponent: () =>
          import('./features/servicios/detalle/servicio-detalle.page').then(
            (m) => m.ServicioDetallePage,
          ),
      },
      {
        path: 'tecnico/servicios',
        title: 'Mis servicios | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/servicios/lista/mis-servicios.page').then((m) => m.MisServiciosPage),
      },
      {
        path: 'tecnico/servicios/:id',
        title: 'Detalle del servicio | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/servicios/detalle/servicio-detalle.page').then(
            (m) => m.ServicioDetallePage,
          ),
      },
      {
        path: 'tecnico/perfil',
        title: 'Mi perfil | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/perfil/perfil.page').then((m) => m.PerfilTecnicoPage),
      },
      {
        path: 'tecnico/comisiones',
        title: 'Comisiones y pagos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/comisiones/tecnico/mis-comisiones.page').then(
            (m) => m.MisComisionesPage,
          ),
      },
      {
        path: 'tecnico/solicitudes',
        title: 'Solicitudes disponibles | FIXTECH',
        canActivate: [roleGuard, tecnicoAprobadoGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/solicitudes/lista/solicitudes-disponibles.page').then(
            (m) => m.SolicitudesDisponiblesPage,
          ),
      },
      {
        path: 'tecnico/solicitudes/:solicitudId/ofertar',
        title: 'Enviar oferta | FIXTECH',
        canActivate: [roleGuard, tecnicoAprobadoGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/ofertas/formulario/oferta-form.page').then(
            (m) => m.OfertaFormPage,
          ),
      },
      {
        path: 'tecnico/solicitudes/:id',
        title: 'Detalle de solicitud disponible | FIXTECH',
        canActivate: [roleGuard, tecnicoAprobadoGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/solicitudes/detalle/solicitud-disponible.page').then(
            (m) => m.SolicitudDisponiblePage,
          ),
      },
      {
        path: 'tecnico/ofertas',
        title: 'Mis ofertas | FIXTECH',
        canActivate: [roleGuard, tecnicoAprobadoGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/ofertas/lista/mis-ofertas.page').then((m) => m.MisOfertasPage),
      },
      {
        path: 'tecnico/ofertas/:ofertaId/editar',
        title: 'Editar oferta | FIXTECH',
        canActivate: [roleGuard, tecnicoAprobadoGuard],
        data: { roles: ['TECNICO'] },
        loadComponent: () =>
          import('./features/tecnico/ofertas/formulario/oferta-form.page').then(
            (m) => m.OfertaFormPage,
          ),
      },
      {
        path: 'admin/tecnicos',
        title: 'Verificación de técnicos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/tecnicos/tecnicos.page').then((m) => m.AdminTecnicosPage),
      },
      {
        path: 'admin/usuarios',
        title: 'Usuarios y accesos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.page').then((m) => m.AdminUsuariosPage),
      },
      {
        path: 'admin/resenas',
        title: 'Moderación de reseñas | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/resenas/resenas.page').then((m) => m.AdminResenasPage),
      },
      {
        path: 'admin/reclamos',
        title: 'Seguimiento de reclamos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/reclamos/reclamos.page').then((m) => m.AdminReclamosPage),
      },
      {
        path: 'admin/comisiones',
        title: 'Comisiones y pagos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/comisiones/admin/admin-comisiones.page').then(
            (m) => m.AdminComisionesPage,
          ),
      },
      {
        path: 'admin/catalogos',
        title: 'Catálogos | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/catalogos/catalogos.page').then((m) => m.AdminCatalogosPage),
      },
      {
        path: 'admin/parametros',
        title: 'Parámetros del sistema | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/parametros/parametros.page').then((m) => m.AdminParametrosPage),
      },
      {
        path: 'admin/reportes',
        title: 'Reportes e indicadores | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/reportes/reportes.page').then((m) => m.AdminReportesPage),
      },
      {
        path: 'admin/auditoria',
        title: 'Auditoría | FIXTECH',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/auditoria/auditoria.page').then((m) => m.AdminAuditoriaPage),
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
