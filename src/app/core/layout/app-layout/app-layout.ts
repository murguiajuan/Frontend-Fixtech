import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, linkedSignal } from '@angular/core';
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
import { ETIQUETAS_ROL } from '../../models/etiquetas';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { Icono } from '../../../shared/ui/icono';

interface ItemNavegacion {
  readonly etiqueta: string;
  readonly icono: string;
  readonly ruta: string;
  readonly disponible: boolean;
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

  protected readonly perfil = this.auth.perfil;
  protected readonly rol = this.auth.rol;
  protected readonly etiquetasRol = ETIQUETAS_ROL;

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
    ];
    if (rol === 'CLIENTE') {
      items.push(
        {
          etiqueta: 'Mis solicitudes',
          icono: 'assignment',
          ruta: '/app/cliente/solicitudes',
          disponible: false,
        },
        {
          etiqueta: 'Mis servicios',
          icono: 'build_circle',
          ruta: '/app/cliente/servicios',
          disponible: false,
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
          disponible: false,
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
    this.auth.cerrarSesion();
  }
}
