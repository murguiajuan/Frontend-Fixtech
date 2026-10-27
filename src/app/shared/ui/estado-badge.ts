import { Component, input } from '@angular/core';
import { TonoBadge } from '../../core/models/etiquetas';

@Component({
  selector: 'app-estado-badge',
  template: `<span
    class="badge"
    [class.badge--ok]="tono() === 'ok'"
    [class.badge--alerta]="tono() === 'alerta'"
    [class.badge--error]="tono() === 'error'"
    [class.badge--info]="tono() === 'info'"
    >{{ texto() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.22rem 0.6rem;
      border-radius: 999px;
      background: var(--ft-surface-muted);
      color: var(--ft-on-surface-muted);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.35;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .badge--ok {
      background: var(--ft-success-bg);
      color: var(--ft-success);
    }

    .badge--alerta {
      background: var(--ft-warning-bg);
      color: var(--ft-warning);
    }

    .badge--error {
      background: var(--ft-danger-bg);
      color: var(--ft-danger);
    }

    .badge--info {
      background: var(--ft-primary-50);
      color: var(--ft-primary-800);
    }
  `,
})
export class EstadoBadge {
  readonly texto = input.required<string>();
  readonly tono = input<TonoBadge>('neutral');
}
