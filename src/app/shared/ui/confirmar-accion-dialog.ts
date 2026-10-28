import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface MotivoConfirmacion {
  readonly etiqueta: string;
  readonly requerido: boolean;
  readonly maxLongitud: number;
  readonly ayuda?: string;
}

export interface ConfirmarAccionData {
  readonly titulo: string;
  readonly mensaje: string;
  readonly detalle?: string;
  readonly etiquetaConfirmar?: string;
  readonly etiquetaCancelar?: string;
  readonly icono?: string;
  readonly peligro?: boolean;
  readonly motivo?: MotivoConfirmacion;
}

export interface ConfirmarAccionResultado {
  readonly motivo: string | null;
}

@Component({
  selector: 'app-confirmar-accion-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>
      <div class="confirmar__encabezado">
        <span
          class="confirmar__icono"
          [class.confirmar__icono--peligro]="datos.peligro === true"
          aria-hidden="true"
        >
          <mat-icon>{{ datos.icono ?? 'help_outline' }}</mat-icon>
        </span>
        <div>
          <p>{{ datos.mensaje }}</p>
          @if (datos.detalle) {
            <p class="confirmar__detalle">{{ datos.detalle }}</p>
          }
        </div>
      </div>

      @if (datos.motivo; as configuracion) {
        <mat-form-field appearance="outline">
          <mat-label>{{ configuracion.etiqueta }}</mat-label>
          <textarea
            matInput
            rows="3"
            [formControl]="motivo"
            [attr.maxlength]="configuracion.maxLongitud"
            [attr.aria-describedby]="'ayuda-motivo-confirmacion'"
          ></textarea>
          <mat-hint id="ayuda-motivo-confirmacion">
            {{ configuracion.ayuda ?? 'Máximo ' + configuracion.maxLongitud + ' caracteres.' }}
          </mat-hint>
          @if (motivo.hasError('required') && enviado()) {
            <mat-error>Escribe un motivo para continuar.</mat-error>
          }
        </mat-form-field>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancelar()">
        {{ datos.etiquetaCancelar ?? 'Volver' }}
      </button>
      <button
        mat-flat-button
        type="button"
        [class.confirmar__boton--peligro]="datos.peligro === true"
        (click)="confirmar()"
      >
        <mat-icon aria-hidden="true">{{ datos.icono ?? 'check' }}</mat-icon>
        {{ datos.etiquetaConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .confirmar__encabezado {
      display: flex;
      gap: 0.8rem;
      align-items: flex-start;
    }

    .confirmar__encabezado p {
      font-size: 0.9rem;
      line-height: 1.55;
    }

    .confirmar__detalle {
      margin-top: 0.4rem;
      color: var(--ft-on-surface-muted);
      font-size: 0.82rem !important;
    }

    .confirmar__icono {
      display: grid;
      flex: 0 0 2.6rem;
      width: 2.6rem;
      height: 2.6rem;
      place-items: center;
      border-radius: 999px;
      background: var(--ft-primary-50);
      color: var(--ft-primary-700);
    }

    .confirmar__icono--peligro {
      background: var(--ft-danger-bg);
      color: var(--ft-danger);
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    .confirmar__boton--peligro {
      --mat-button-filled-container-color: var(--ft-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class ConfirmarAccionDialog {
  private readonly referencia =
    inject<MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = inject<ConfirmarAccionData>(MAT_DIALOG_DATA);
  protected readonly enviado = signal(false);

  protected readonly motivo = this.fb.control('', [
    ...(this.datos.motivo?.requerido === true ? [Validators.required] : []),
    Validators.maxLength(this.datos.motivo?.maxLongitud ?? 300),
  ]);

  protected cancelar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    this.enviado.set(true);
    if (this.motivo.invalid) {
      this.motivo.markAsTouched();
      return;
    }
    const texto = this.motivo.value.trim();
    this.referencia.close({ motivo: texto === '' ? null : texto });
  }
}
