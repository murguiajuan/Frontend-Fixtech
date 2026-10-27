import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ETIQUETAS_EMISOR,
  ETIQUETAS_ESTADO_CONTRAOFERTA,
  TONOS_ESTADO_CONTRAOFERTA,
} from '../oferta-etiquetas';
import { Contraoferta } from '../oferta.models';

@Component({
  selector: 'app-negociacion-historial',
  imports: [DatePipe, DecimalPipe, EstadoBadge],
  template: `
    @if (contraofertas().length === 0) {
      <p class="historial__vacio">{{ mensajeVacio() }}</p>
    } @else {
      <ol class="historial" aria-label="Historial de negociación">
        @for (contraoferta of contraofertas(); track contraoferta.id) {
          <li class="historial__ronda">
            <div class="historial__cabecera">
              <strong
                >Ronda {{ contraoferta.ronda }} · {{ etiquetasEmisor[contraoferta.emisor] }}</strong
              >
              <app-estado-badge
                [texto]="etiquetasEstado[contraoferta.estado]"
                [tono]="tonosEstado[contraoferta.estado]"
              />
            </div>
            <p class="historial__monto">
              Propuesta de servicio:
              <strong>S/ {{ contraoferta.montoPropuesto | number: '1.2-2' }}</strong>
            </p>
            @if (contraoferta.mensaje) {
              <p class="historial__mensaje">{{ contraoferta.mensaje }}</p>
            }
            <time class="historial__fecha" [attr.datetime]="contraoferta.creadoEn">
              {{ contraoferta.creadoEn | date: 'dd MMM yyyy, HH:mm' }}
            </time>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .historial {
      display: grid;
      gap: 0.6rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .historial__ronda {
      display: grid;
      gap: 0.2rem;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-md);
      background: var(--ft-surface);
    }

    .historial__cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .historial__cabecera strong {
      font-size: 0.8rem;
    }

    .historial__monto {
      font-size: 0.82rem;
    }

    .historial__mensaje {
      color: var(--ft-on-surface-muted);
      font-size: 0.8rem;
      line-height: 1.45;
      white-space: pre-line;
    }

    .historial__fecha {
      color: var(--ft-on-surface-muted);
      font-size: 0.7rem;
    }

    .historial__vacio {
      color: var(--ft-on-surface-muted);
      font-size: 0.82rem;
      line-height: 1.5;
    }
  `,
})
export class NegociacionHistorial {
  readonly contraofertas = input.required<readonly Contraoferta[]>();
  readonly mensajeVacio = input('Aún no hay contraofertas en esta oferta.');

  protected readonly etiquetasEmisor = ETIQUETAS_EMISOR;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_CONTRAOFERTA;
  protected readonly tonosEstado = TONOS_ESTADO_CONTRAOFERTA;
}
