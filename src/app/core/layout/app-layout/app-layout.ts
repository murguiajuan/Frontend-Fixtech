import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, DestroyRef, effect, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { SesionExpiradaService } from '../../auth/sesion-expirada.service';
import { ETIQUETAS_ROL } from '../../models/etiquetas';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { Icono } from '../../../shared/ui/icono';

interface ItemNavegacion {
  readonly etiqueta: string;
  readonly icono: string;
  readonly ruta: string;
  readonly disponible: boolean;
  readonly contador?: number;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    BrandLogo,
    Icono,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly sesionExpirada = inject(SesionExpiradaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly perfil = this.auth.perfil;
  protected readonly rol = this.auth.rol;
  protected readonly noLeidas = this.notificaciones.noLeidas;
  protected readonly etiquetasRol = ETIQUETAS_ROL;

  protected readonly textoNotificaciones = computed(() => {
    const total = this.noLeidas();
    if (total === 0) {
      return 'Notificaciones: no hay pendientes sin leer';
    }
    return total === 1 ? 'Notificaciones: 1 sin leer' : `Notificaciones: ${total} sin leer`;
  });

  constructor() {
    this.destroyRef.onDestroy(this.notificaciones.iniciarPolling());
    effect(() => {
      if (!this.sesionExpirada.expirada()) {
        return;
      }
      this.notificaciones.limpiar();
      this.auth.cerrarSesion(false);
      void this.router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
    });
  }

  private readonly esMovilSignal = toSignal(
    this.breakpoint.observe('(max-width: 899px)').pipe(map((resultado) => resultado.matches)),
    { initialValue: false },
  );

  protected readonly esMovil = this.esMovilSignal;
  protected readonly sidenavAbierto = linkedSignal(() => !this.esMovilSignal());

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navegacion = computed<ItemNavegacion[]>(() => {
    const rol = this.auth.rol();
    if (rol === null) {
      return [];
    }
    const items: ItemNavegacion[] = [
      {
        etiqueta: 'Inicio',
        icono: 'space_dashboard',
        ruta: '/app/inicio',
        disponible: true,
      },
      {
        etiqueta: 'Notificaciones',
        icono: 'notifications',
        ruta: '/app/notificaciones',
        disponible: true,
        contador: this.noLeidas(),
      },
      {
        etiqueta: 'Mi cuenta',
        icono: 'account_circle',
        ruta: '/app/perfil',
        disponible: true,
      },
    ];
    if (rol === 'CLIENTE') {
      items.push(
        {
          etiqueta: 'Mis solicitudes',
          icono: 'assignment',
          ruta: '/app/cliente/solicitudes',
          disponible: true,
        },
        {
          etiqueta: 'Mis servicios',
          icono: 'build_circle',
          ruta: '/app/cliente/servicios',
          disponible: true,
        },
      );
    } else if (rol === 'TECNICO') {
      const habilitado = this.auth.puedeOfertar();
      items.push(
        {
          etiqueta: 'Mi perfil',
          icono: 'badge',
          ruta: '/app/tecnico/perfil',
          disponible: true,
        },
        {
          etiqueta: 'Solicitudes disponibles',
          icono: 'work_outline',
          ruta: '/app/tecnico/solicitudes',
          disponible: habilitado,
        },
        {
          etiqueta: 'Mis ofertas',
          icono: 'request_quote',
          ruta: '/app/tecnico/ofertas',
          disponible: habilitado,
        },
        {
          etiqueta: 'Mis servicios',
          icono: 'build_circle',
          ruta: '/app/tecnico/servicios',
          disponible: true,
        },
        {
          etiqueta: 'Comisiones',
          icono: 'payments',
          ruta: '/app/tecnico/comisiones',
          disponible: true,
        },
      );
    } else {
      items.push(
        {
          etiqueta: 'Técnicos',
          icono: 'verified_user',
          ruta: '/app/admin/tecnicos',
          disponible: true,
        },
        {
          etiqueta: 'Usuarios',
          icono: 'group',
          ruta: '/app/admin/usuarios',
          disponible: true,
        },
        {
          etiqueta: 'Reseñas',
          icono: 'reviews',
          ruta: '/app/admin/resenas',
          disponible: true,
        },
        {
          etiqueta: 'Reclamos',
          icono: 'support_agent',
          ruta: '/app/admin/reclamos',
          disponible: true,
        },
        {
          etiqueta: 'Pagos y deudores',
          icono: 'account_balance_wallet',
          ruta: '/app/admin/comisiones',
          disponible: true,
        },
        {
          etiqueta: 'Reportes',
          icono: 'monitoring',
          ruta: '/app/admin/reportes',
          disponible: true,
        },
        {
          etiqueta: 'Catálogos',
          icono: 'category',
          ruta: '/app/admin/catalogos',
          disponible: true,
        },
        {
          etiqueta: 'Parámetros',
          icono: 'tune',
          ruta: '/app/admin/parametros',
          disponible: true,
        },
        {
          etiqueta: 'Auditoría',
          icono: 'history',
          ruta: '/app/admin/auditoria',
          disponible: true,
        },
      );
    }
    return items;
  });

  protected readonly tituloActual = computed(() => {
    const ruta = this.urlActual();
    const item = this.navegacion().find((nav) => ruta.startsWith(nav.ruta));
    return item?.etiqueta ?? 'Inicio';
  });

  protected alternarSidenav(): void {
    this.sidenavAbierto.update((abierto) => !abierto);
  }

  protected cerrarEnMovil(): void {
    if (this.esMovil()) {
      this.sidenavAbierto.set(false);
    }
  }

  protected cerrarSesion(): void {
    this.notificaciones.limpiar();
    this.auth.cerrarSesion();
  }
}
