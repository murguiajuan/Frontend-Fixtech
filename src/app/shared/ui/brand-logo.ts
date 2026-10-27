import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-brand',
  imports: [MatIconModule],
  template: `
    <span class="marca" [class.marca--compacta]="compacta()">
      <span class="marca__icono" aria-hidden="true">
        <mat-icon>handyman</mat-icon>
      </span>
      <span class="marca__texto">
        <strong>FIXTECH</strong>
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
      color: inherit;
      text-decoration: none;
    }

    .marca__icono {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      place-items: center;
      border-radius: 0.8rem;
      background: linear-gradient(145deg, var(--ft-primary-600), var(--ft-primary-900));
      box-shadow: 0 6px 16px rgb(6 55 70 / 22%);
      color: #fff;
    }

    .marca__icono mat-icon {
      width: 1.4rem;
      height: 1.4rem;
      font-size: 1.4rem;
    }

    .marca__texto {
      display: grid;
      line-height: 1;
    }

    .marca__texto strong {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.08em;
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
