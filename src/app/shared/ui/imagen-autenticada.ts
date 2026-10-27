import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { resolverUrlArchivo } from '../../core/http/url-archivo';

type EstadoImagen = 'vacia' | 'cargando' | 'lista' | 'error';

@Component({
  selector: 'app-imagen-autenticada',
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    @switch (estado()) {
      @case ('cargando') {
        <span class="imagen__estado" role="status" aria-label="Cargando imagen">
          <mat-spinner diameter="24" aria-hidden="true" />
        </span>
      }
      @case ('lista') {
        <img class="imagen" [src]="urlObjeto()" [alt]="alt()" decoding="async" />
      }
      @case ('error') {
        <span class="imagen__estado" role="img" [attr.aria-label]="alt() + ': no disponible'">
          <mat-icon aria-hidden="true">broken_image</mat-icon>
        </span>
      }
      @default {
        <span class="imagen__estado" role="img" [attr.aria-label]="alt() + ': sin imagen'">
          <mat-icon aria-hidden="true">image</mat-icon>
        </span>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .imagen {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .imagen__estado {
      display: grid;
      width: 100%;
      height: 100%;
      min-height: 2.5rem;
      place-items: center;
      background: var(--ft-surface-muted);
      color: var(--ft-on-surface-muted);
    }

    mat-spinner {
      --mat-progress-spinner-active-indicator-color: var(--ft-primary-600);
    }
  `,
})
export class ImagenAutenticada {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly src = input<string | null>(null);
  readonly alt = input.required<string>();
  readonly version = input(0);

  protected readonly urlObjeto = signal<string | null>(null);
  protected readonly estado = signal<EstadoImagen>('vacia');

  private urlActual: string | null = null;

  constructor() {
    effect((onCleanup) => {
      const ruta = this.src();
      this.version();
      this.urlObjeto.set(null);
      this.estado.set(ruta ? 'cargando' : 'vacia');
      if (ruta === null) {
        return;
      }

      const peticion = this.http.get(resolverUrlArchivo(ruta), { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.urlActual = URL.createObjectURL(blob);
          this.urlObjeto.set(this.urlActual);
          this.estado.set('lista');
        },
        error: () => {
          this.estado.set('error');
        },
      });

      onCleanup(() => {
        peticion.unsubscribe();
        this.revocar();
      });
    });

    this.destroyRef.onDestroy(() => this.revocar());
  }

  private revocar(): void {
    if (this.urlActual !== null) {
      URL.revokeObjectURL(this.urlActual);
      this.urlActual = null;
    }
  }
}
