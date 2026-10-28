import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';

export interface ComprobantePagoDialogData {
  readonly titulo: string;
  readonly url: string;
  readonly alt: string;
  readonly datos: readonly ComprobantePagoDato[];
}

export interface ComprobantePagoDato {
  readonly etiqueta: string;
  readonly valor: string;
}

@Component({
  selector: 'app-comprobante-pago-dialog',
  imports: [MatDialogModule, MatIconModule, ImagenAutenticada],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content class="comprobante__contenido" tabindex="0">
      <dl class="comprobante__datos">
        @for (dato of datos.datos; track dato.etiqueta) {
          <div>
            <dt>{{ dato.etiqueta }}</dt>
            <dd>{{ dato.valor }}</dd>
          </div>
        }
      </dl>

      <figure class="comprobante__marco">
        <app-imagen-autenticada [src]="datos.url" [alt]="datos.alt" ajuste="contain" />
        <figcaption>
          <mat-icon aria-hidden="true">verified_user</mat-icon>
          Imagen protegida: se descarga con su sesión.
        </figcaption>
      </figure>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .comprobante__contenido {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .comprobante__datos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
      margin: 0;
    }

    .comprobante__datos > div {
      padding: 0.5rem 0.65rem;
      border-radius: var(--ft-radius-sm);
      background: var(--ft-surface);
    }

    .comprobante__datos dt {
      color: var(--ft-on-surface-muted);
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .comprobante__datos dd {
      margin: 0.15rem 0 0;
      overflow-wrap: anywhere;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .comprobante__marco {
      overflow: hidden;
      margin: 0;
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-md);
      background: var(--ft-surface-muted);
    }

    .comprobante__marco app-imagen-autenticada {
      display: block;
      height: min(50vh, 32rem);
      min-height: 12rem;
    }

    .comprobante__marco figcaption {
      display: flex;
      gap: 0.35rem;
      align-items: center;
      padding: 0.5rem 0.65rem;
      border-top: 1px solid var(--ft-border);
      background: var(--ft-surface-raised);
      color: var(--ft-on-surface-muted);
      font-size: 0.72rem;
    }

    .comprobante__marco figcaption mat-icon {
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }

    @media (min-width: 48rem) {
      .comprobante__datos {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `,
})
export class ComprobantePagoDialog {
  protected readonly datos = inject<ComprobantePagoDialogData>(MAT_DIALOG_DATA);
}
