import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type NombreIcono = 'menu' | 'visibility' | 'visibility_off' | 'expand_more' | 'persona';

@Component({
  selector: 'app-icono',
  imports: [MatIconModule],
  template: `<mat-icon aria-hidden="true">{{ simbolo() }}</mat-icon>`,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      line-height: 0;
    }

    mat-icon {
      width: var(--icono-size, 1.5rem);
      height: var(--icono-size, 1.5rem);
      font-size: var(--icono-size, 1.5rem);
    }
  `,
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  protected readonly simbolo = computed(() =>
    this.nombre() === 'persona' ? 'person' : this.nombre(),
  );
}
