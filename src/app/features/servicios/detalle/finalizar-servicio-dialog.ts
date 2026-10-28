import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ETIQUETAS_METODO_PAGO, METODOS_PAGO } from '../servicio-etiquetas';
import { MetodoPago } from '../servicio.models';

export interface FinalizarServicioData {
  readonly servicioId: number;
  readonly montoTotal: number;
}

export interface FinalizarServicioResultado {
  readonly montoFinal: number;
  readonly metodoPago: MetodoPago;
}

@Component({
  selector: 'app-finalizar-servicio-dialog',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>Finalizar servicio #{{ datos.servicioId }}</h2>
    <mat-dialog-content>
      <div class="finalizar__monto">
        <span>Monto final a cobrar</span>
        <strong>S/ {{ datos.montoTotal | number: '1.2-2' }}</strong>
        <p>
          El monto debe coincidir con el total aprobado. El costo de diagnóstico se muestra aparte y
          no se suma al total.
        </p>
      </div>

      <form [formGroup]="formulario" class="finalizar__formulario">
        <fieldset class="finalizar__metodos">
          <legend>Método de pago</legend>
          <mat-radio-group formControlName="metodoPago" aria-label="Método de pago">
            @for (metodo of metodosPago; track metodo) {
              <mat-radio-button [value]="metodo">
                {{ etiquetasMetodoPago[metodo] }}
              </mat-radio-button>
            }
          </mat-radio-group>
          @if (formulario.controls.metodoPago.hasError('required') && enviado()) {
            <p class="finalizar__error" role="alert">Selecciona un método de pago.</p>
          }
        </fieldset>

        <div class="ft-alert ft-alert--info" role="note">
          <mat-icon aria-hidden="true">schedule</mat-icon>
          <span>
            Al finalizar, el cliente tendrá un plazo para confirmar su conformidad. Si no lo hace,
            el servicio se confirmará automáticamente.
          </span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancelar()">Volver</button>
      <button mat-flat-button type="button" (click)="confirmar()">
        <mat-icon aria-hidden="true">task_alt</mat-icon>
        Finalizar servicio
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .finalizar__monto {
      display: grid;
      gap: 0.15rem;
      padding: 0.85rem;
      border-radius: var(--ft-radius-md);
      background: var(--ft-primary-50);
    }

    .finalizar__monto span {
      color: var(--ft-on-surface-muted);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .finalizar__monto strong {
      color: var(--ft-primary-950);
      font-size: 1.45rem;
    }

    .finalizar__monto p {
      margin-top: 0.2rem;
      color: var(--ft-on-surface-muted);
      font-size: 0.76rem;
      line-height: 1.45;
    }

    .finalizar__formulario {
      display: grid;
      gap: 0.85rem;
    }

    .finalizar__metodos {
      display: grid;
      gap: 0.4rem;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .finalizar__metodos legend {
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .finalizar__metodos mat-radio-group {
      display: grid;
      gap: 0.25rem;
    }

    .finalizar__error {
      color: var(--ft-danger);
      font-size: 0.8rem;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }
  `,
})
export class FinalizarServicioDialog {
  private readonly referencia =
    inject<MatDialogRef<FinalizarServicioDialog, FinalizarServicioResultado | undefined>>(
      MatDialogRef,
    );
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = inject<FinalizarServicioData>(MAT_DIALOG_DATA);
  protected readonly enviado = signal(false);
  protected readonly etiquetasMetodoPago = ETIQUETAS_METODO_PAGO;
  protected readonly metodosPago = METODOS_PAGO;
  protected readonly formulario = this.fb.group({
    metodoPago: this.fb.control<MetodoPago | null>(null, [Validators.required]),
  });

  protected cancelar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const metodoPago = this.formulario.controls.metodoPago.value;
    if (metodoPago === null) {
      return;
    }
    this.referencia.close({ montoFinal: this.datos.montoTotal, metodoPago });
  }
}
