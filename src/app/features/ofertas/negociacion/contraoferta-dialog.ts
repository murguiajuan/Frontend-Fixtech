import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import {
  AccionContraoferta,
  ContraofertaRequest,
  EmisorContraoferta,
  Oferta,
} from '../oferta.models';
import { ETIQUETAS_EMISOR, contraofertaPendiente } from '../oferta-etiquetas';

export interface ContraofertaData {
  readonly oferta: Oferta;
  readonly emisor: EmisorContraoferta;
}

@Component({
  selector: 'app-contraoferta-dialog',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ titulo() }}</h2>
    <mat-dialog-content>
      <p class="dialogo__contexto">
        Oferta de <strong>{{ nombreTecnico() }}</strong> para la solicitud
        <strong>#{{ datos.oferta.solicitudId }}</strong
        >.
      </p>

      <dl class="dialogo__resumen">
        <div>
          <dt>Precio del servicio</dt>
          <dd>S/ {{ datos.oferta.precioServicio | number: '1.2-2' }}</dd>
        </div>
        <div>
          <dt>Total de la oferta</dt>
          <dd>S/ {{ datos.oferta.precioTotal | number: '1.2-2' }}</dd>
        </div>
      </dl>

      @if (pendiente(); as contraoferta) {
        <div class="ft-alert ft-alert--info" role="note">
          <mat-icon aria-hidden="true">swap_horiz</mat-icon>
          <div>
            <strong>Contraoferta pendiente del {{ etiquetasEmisor[contraoferta.emisor] }}</strong>
            <p>
              Ronda {{ contraoferta.ronda }}: propone S/
              {{ contraoferta.montoPropuesto | number: '1.2-2' }} por el servicio.
            </p>
            @if (contraoferta.mensaje) {
              <p class="dialogo__mensaje">{{ contraoferta.mensaje }}</p>
            }
          </div>
        </div>
      } @else {
        <p class="dialogo__nota">
          Propón un nuevo precio por el servicio. La movilidad y el diagnóstico se mantienen tal
          como están en la oferta actual.
        </p>
      }

      <form [formGroup]="formulario" class="dialogo__formulario">
        @if (puedeElegirAccion()) {
          <mat-radio-group
            formControlName="accion"
            aria-label="Acción de negociación"
            class="dialogo__acciones"
          >
            <mat-radio-button value="CONTRAOFERTA">Enviar una contraoferta</mat-radio-button>
            <mat-radio-button value="ACEPTAR">Aceptar la contraoferta</mat-radio-button>
            <mat-radio-button value="RECHAZAR">Rechazar la oferta</mat-radio-button>
          </mat-radio-group>
        }

        @if (accion() === 'CONTRAOFERTA') {
          <mat-form-field appearance="outline">
            <mat-label>Monto propuesto por el servicio</mat-label>
            <span matTextPrefix>S/&nbsp;</span>
            <input
              matInput
              type="number"
              formControlName="montoPropuesto"
              min="0.01"
              max="99999999.99"
              step="0.01"
              inputmode="decimal"
              [attr.aria-invalid]="
                formulario.controls.montoPropuesto.invalid &&
                formulario.controls.montoPropuesto.touched
              "
            />
            <mat-hint
              >El monto no incluye la movilidad; el total se recalcula al aplicarlo.</mat-hint
            >
            @if (
              formulario.controls.montoPropuesto.hasError('required') ||
              formulario.controls.montoPropuesto.hasError('min')
            ) {
              <mat-error>El monto debe ser mayor a cero.</mat-error>
            } @else if (formulario.controls.montoPropuesto.hasError('max')) {
              <mat-error>El monto no puede superar S/ 99,999,999.99.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mensaje (opcional)</mat-label>
            <textarea
              matInput
              formControlName="mensaje"
              rows="3"
              maxlength="300"
              placeholder="Explica brevemente tu propuesta."
            ></textarea>
            <mat-hint>Máximo 300 caracteres.</mat-hint>
            @if (formulario.controls.mensaje.hasError('maxlength')) {
              <mat-error>El mensaje no puede superar los 300 caracteres.</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="dialogo__nota">{{ explicacionAccion() }}</p>
          <mat-checkbox formControlName="confirmo">
            Confirmo que deseo {{ accion() === 'ACEPTAR' ? 'aceptar' : 'rechazar' }} esta
            contraoferta
          </mat-checkbox>
          @if (formulario.controls.confirmo.hasError('required') && enviado()) {
            <p class="dialogo__error" role="alert">Marca la confirmación para continuar.</p>
          }
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cerrar()">Volver</button>
      <button
        mat-flat-button
        type="button"
        [class.dialogo__confirmar--peligro]="accion() === 'RECHAZAR'"
        (click)="confirmar()"
      >
        <mat-icon aria-hidden="true">{{ iconoConfirmar() }}</mat-icon>
        {{ etiquetaConfirmar() }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 0.85rem;
      padding-top: 0.5rem;
    }

    .dialogo__contexto,
    .dialogo__nota,
    .dialogo__mensaje {
      color: var(--ft-on-surface-muted);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .dialogo__resumen {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
      margin: 0;
      padding: 0.75rem;
      border-radius: var(--ft-radius-md);
      background: var(--ft-surface);
    }

    .dialogo__resumen dt {
      color: var(--ft-on-surface-muted);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .dialogo__resumen dd {
      margin: 0.15rem 0 0;
      color: var(--ft-primary-900);
      font-size: 0.95rem;
      font-weight: 700;
    }

    .dialogo__formulario {
      display: grid;
      gap: 0.75rem;
    }

    .dialogo__acciones {
      display: grid;
      gap: 0.35rem;
    }

    .dialogo__error {
      color: var(--ft-danger);
      font-size: 0.82rem;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    .dialogo__confirmar--peligro {
      --mat-button-filled-container-color: var(--ft-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class ContraofertaDialog {
  private readonly referencia =
    inject<MatDialogRef<ContraofertaDialog, ContraofertaRequest | undefined>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly datos = inject<ContraofertaData>(MAT_DIALOG_DATA);
  protected readonly etiquetasEmisor = ETIQUETAS_EMISOR;
  protected readonly enviado = signal(false);

  protected readonly pendiente = computed(() => contraofertaPendiente(this.datos.oferta));
  protected readonly puedeElegirAccion = computed(() => this.pendiente() !== null);
  protected readonly nombreTecnico = computed(() =>
    `${this.datos.oferta.tecnico.nombres} ${this.datos.oferta.tecnico.apellidos}`.trim(),
  );

  protected readonly formulario = this.fb.group({
    accion: ['CONTRAOFERTA' as AccionContraoferta, [Validators.required]],
    montoPropuesto: this.fb.control<number | null>(
      this.pendiente()?.montoPropuesto ?? this.datos.oferta.precioServicio,
      [Validators.required, Validators.min(0.01), Validators.max(99_999_999.99)],
    ),
    mensaje: ['', [Validators.maxLength(300)]],
    confirmo: [false],
  });

  protected readonly accion = toSignal(this.formulario.controls.accion.valueChanges, {
    initialValue: this.formulario.controls.accion.value,
  });
  protected readonly titulo = computed(() =>
    this.pendiente() === null ? 'Hacer una contraoferta' : 'Responder la contraoferta',
  );
  protected readonly etiquetaConfirmar = computed(() => {
    switch (this.accion()) {
      case 'ACEPTAR':
        return 'Aceptar contraoferta';
      case 'RECHAZAR':
        return 'Rechazar oferta';
      default:
        return 'Enviar contraoferta';
    }
  });
  protected readonly iconoConfirmar = computed(() => {
    switch (this.accion()) {
      case 'ACEPTAR':
        return 'check_circle';
      case 'RECHAZAR':
        return 'block';
      default:
        return 'swap_horiz';
    }
  });
  protected readonly explicacionAccion = computed(() => {
    if (this.accion() === 'ACEPTAR') {
      const monto = this.pendiente()?.montoPropuesto ?? this.datos.oferta.precioTotal;
      if (this.datos.emisor === 'CLIENTE') {
        return `Al aceptar la propuesta de S/ ${monto.toFixed(2)}, se confirmará el servicio con este técnico y se rechazarán las demás ofertas.`;
      }
      return `Al aceptar la propuesta del cliente, el precio del servicio de tu oferta se actualizará a S/ ${monto.toFixed(2)}. El cliente podrá confirmar el servicio después.`;
    }
    return 'Al rechazar la oferta, esta quedará cerrada y ya no podrá editarse ni negociarse.';
  });

  constructor() {
    this.actualizarValidadores(this.formulario.controls.accion.value);
    this.formulario.controls.accion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((accion) => this.actualizarValidadores(accion));

    if (!this.puedeElegirAccion()) {
      this.formulario.controls.accion.disable();
    }
  }

  protected cerrar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const monto =
      valores.accion === 'CONTRAOFERTA' && valores.montoPropuesto !== null
        ? Number(valores.montoPropuesto)
        : null;
    const mensaje = valores.mensaje.trim();
    this.referencia.close({
      accion: valores.accion as AccionContraoferta,
      montoPropuesto: monto,
      mensaje: mensaje === '' ? null : mensaje,
    });
  }

  private actualizarValidadores(accion: AccionContraoferta): void {
    const monto = this.formulario.controls.montoPropuesto;
    const confirmo = this.formulario.controls.confirmo;

    if (accion === 'CONTRAOFERTA') {
      monto.enable();
      monto.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(99_999_999.99),
      ]);
      confirmo.clearValidators();
      confirmo.setValue(false);
    } else {
      monto.disable();
      monto.clearValidators();
      confirmo.setValidators([Validators.requiredTrue]);
    }
    monto.updateValueAndValidity();
    confirmo.updateValueAndValidity();
  }
}
