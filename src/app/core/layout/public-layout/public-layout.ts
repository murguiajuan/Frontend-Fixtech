import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, skip } from 'rxjs/operators';
import { AvisoConexion } from '../../../shared/ui/aviso-conexion';
import { BrandLogo } from '../../../shared/ui/brand-logo';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, AvisoConexion, BrandLogo],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly enLogin = computed(() => this.urlActual().startsWith('/login'));
  protected readonly enRegistro = computed(() => this.urlActual().startsWith('/registro'));

  constructor() {
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.document.getElementById('contenido')?.focus({ preventScroll: true });
      });
  }
}
