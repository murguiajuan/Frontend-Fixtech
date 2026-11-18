import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-brand',
  imports: [MatIconModule],
  template: `
    <span class="marca" [class.marca--compacta]="compacta()">
      <span class="marca__icono" aria-hidden="true">
        <mat-icon>settings</mat-icon>
        <mat-icon class="marca__herramienta">build</mat-icon>
      </span>
      <span class="marca__texto">
        <strong>FIX<span>TECH</span></strong>
        @if (!compacta()) {
          <small>Servicios técnicos</small>
        }
      </span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .marca {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      color: var(--ft-primary-900);
      text-decoration: none;
    }

    .marca__icono {
      display: inline-flex;
      position: relative;
      flex: 0 0 auto;
      width: var(--ft-brand-icon-size, 2.75rem);
      height: var(--ft-brand-icon-size, 2.75rem);
      color: var(--ft-primary-600);
    }

    .marca__icono mat-icon {
      width: 100%;
      height: 100%;
      font-size: var(--ft-brand-icon-size, 2.75rem);
    }

    .marca__icono .marca__herramienta {
      position: absolute;
      inset: 25%;
      width: 50%;
      height: 50%;
      font-size: calc(var(--ft-brand-icon-size, 2.75rem) / 2);
      color: var(--ft-primary-600);
      background: var(--ft-surface-raised);
      border-radius: 50%;
    }

    .marca__texto {
      display: grid;
      line-height: 1;
    }

    .marca__texto strong {
      font-size: var(--ft-brand-text-size, 1.65rem);
      font-weight: 900;
      letter-spacing: -0.045em;
      white-space: nowrap;
    }

    .marca__texto strong span {
      color: var(--ft-primary-600);
    }

    .marca__texto small {
      margin-top: 0.25rem;
      color: var(--ft-on-surface-muted);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .marca--compacta .marca__texto small {
      display: none;
    }
  `,
})
export class BrandLogo {
  readonly compacta = input(false);
}
