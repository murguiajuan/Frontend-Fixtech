import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AjustePrecioRequest } from '../servicio.models';
import { formatearBytes, validarImagen } from '../servicio-archivos';

export interface AjustePrecioData {
  readonly montoActual: number;
}

export interface AjustePrecioResultado extends AjustePrecioRequest {
  readonly evidencia: File | null;
}

function mayorQueMontoActual(actual: number) {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null) {
      return null;
    }
    return Number(valor) > actual ? null : { montoNoMayor: true };
  };
}

@Component({
  selector: 'app-ajuste-precio-dialog',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Proponer ajuste de precio</h2>
    <mat-dialog-content>
      <p class="ajuste__contexto">
        El monto actual del servicio es
        <strong>S/ {{ datos.montoActual | number: '1.2-2' }}</strong
        >. Propón un monto mayor y explica el motivo con el mayor detalle posible.
      </p>

      <form [formGroup]="formulario" class="ajuste__formulario">
        <mat-form-field appearance="outline">
          <mat-label>Nuevo monto total</mat-label>
          <span matTextPrefix>S/&nbsp;</span>
          <input
            matInput
            type="number"
            formControlName="montoNuevo"
            min="0.01"
            max="99999999.99"
            step="0.01"
            inputmode="decimal"
          />
          <mat-hint>
            Debe ser mayor a S/ {{ datos.montoActual | number: '1.2-2' }}. Incluye la movilidad.
          </mat-hint>
          @if (formulario.controls.montoNuevo.hasError('required')) {
            <mat-error>Ingresa el nuevo monto.</mat-error>
          } @else if (formulario.controls.montoNuevo.hasError('montoNoMayor')) {
            <mat-error>El monto debe ser mayor al total actual del servicio.</mat-error>
          } @else if (formulario.controls.montoNuevo.hasError('max')) {
            <mat-error>El monto no puede superar S/ 99,999,999.99.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Justificación</mat-label>
          <textarea
            matInput
            formControlName="justificacion"
            rows="4"
            maxlength="500"
            placeholder="Explica qué trabajo adicional o repuesto justifica el nuevo monto."
          ></textarea>
          <mat-hint>Máximo 500 caracteres. El cliente verá este texto.</mat-hint>
          @if (formulario.controls.justificacion.hasError('required')) {
            <mat-error>La justificación es obligatoria.</mat-error>
          }
        </mat-form-field>

        <div class="ajuste__archivo">
          <label class="ajuste__archivo-boton" for="evidencia-ajuste">
            <mat-icon aria-hidden="true">add_photo_alternate</mat-icon>
            Adjuntar evidencia (opcional)
          </label>
          <input
            id="evidencia-ajuste"
            class="ajuste__archivo-input"
            type="file"
            accept="image/jpeg,image/png"
            (change)="seleccionarArchivo($event)"
          />
          <p class="ajuste__ayuda">Imagen JPG o PNG de hasta 5 MB.</p>
          @if (errorArchivo(); as error) {
            <p class="ajuste__error" role="alert">{{ error }}</p>
          }
          @if (archivo(); as seleccionado) {
            <div class="ajuste__archivo-seleccionado">
              <mat-icon aria-hidden="true">image</mat-icon>
              <span>{{ seleccionado.name }} · {{ formatearBytes(seleccionado.size) }}</span>
              <button
                mat-icon-button
                type="button"
                [attr.aria-label]="'Quitar ' + seleccionado.name"
                (click)="quitarArchivo()"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

        <div class="ft-alert ft-alert--warning" role="note">
          <mat-icon aria-hidden="true">hourglass_top</mat-icon>
          <span>
            El servicio quedará pendiente de ajuste hasta que el cliente apruebe o rechace la
            propuesta. Si la rechaza, el servicio se cancelará.
          </span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancelar()">Volver</button>
      <button mat-flat-button type="button" (click)="confirmar()">
        <mat-icon aria-hidden="true">price_change</mat-icon>
        Enviar propuesta
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .ajuste__contexto {
      color: var(--ft-on-surface-muted);
      font-size: 0.86rem;
      line-height: 1.5;
    }

    .ajuste__formulario {
      display: grid;
      gap: 0.75rem;
    }

    .ajuste__archivo {
      display: grid;
      gap: 0.35rem;
      padding: 0.75rem;
      border: 1px dashed var(--ft-border);
      border-radius: var(--ft-radius-md);
      background: var(--ft-surface);
    }

    .ajuste__archivo-boton {
      display: inline-flex;
      gap: 0.4rem;
      align-items: center;
      justify-self: start;
      color: var(--ft-primary-700);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }

    .ajuste__archivo-input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      clip-path: inset(50%);
    }

    .ajuste__archivo-input:focus-visible + * {
      outline: 2px solid var(--ft-primary-600);
    }

    .ajuste__ayuda {
      color: var(--ft-on-surface-muted);
      font-size: 0.72rem;
    }

    .ajuste__error {
      color: var(--ft-danger);
      font-size: 0.78rem;
    }

    .ajuste__archivo-seleccionado {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      padding: 0.35rem 0.4rem 0.35rem 0.55rem;
      border-radius: var(--ft-radius-sm);
      background: var(--ft-primary-50);
      font-size: 0.78rem;
    }

    .ajuste__archivo-seleccionado span {
      flex: 1;
      overflow-wrap: anywhere;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }
  `,
})
export class AjustePrecioDialog {
  private readonly referencia =
    inject<MatDialogRef<AjustePrecioDialog, AjustePrecioResultado | undefined>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = inject<AjustePrecioData>(MAT_DIALOG_DATA);
  protected readonly formatearBytes = formatearBytes;
  protected readonly archivo = signal<File | null>(null);
  protected readonly errorArchivo = signal<string | null>(null);
  protected readonly formulario = this.fb.group({
    montoNuevo: this.fb.control<number | null>(null, [
      Validators.required,
      mayorQueMontoActual(this.datos.montoActual),
      Validators.max(99_999_999.99),
    ]),
    justificacion: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorArchivo.set(null);
    this.archivo.set(null);
    if (archivo === null) {
      return;
    }
    const error = validarImagen(archivo);
    if (error !== null) {
      this.errorArchivo.set(error);
      input.value = '';
      return;
    }
    this.archivo.set(archivo);
    input.value = '';
  }

  protected quitarArchivo(): void {
    this.archivo.set(null);
    this.errorArchivo.set(null);
  }

  protected cancelar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    if (valores.montoNuevo === null) {
      return;
    }
    this.referencia.close({
      montoNuevo: Number(valores.montoNuevo),
      justificacion: valores.justificacion.trim(),
      evidencia: this.archivo(),
    });
  }
}
