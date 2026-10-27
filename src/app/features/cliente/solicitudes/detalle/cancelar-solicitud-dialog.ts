import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface CancelarSolicitudData {
  readonly id: number;
}

@Component({
  selector: 'app-cancelar-solicitud-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Cancelar solicitud #{{ datos.id }}</h2>
    <mat-dialog-content>
      <p>
        Esta acción no se puede deshacer. La solicitud dejará de recibir ofertas y los técnicos
        verán que fue cancelada.
      </p>
      <mat-form-field appearance="outline">
        <mat-label>Motivo de cancelación (opcional)</mat-label>
        <textarea
          matInput
          [formControl]="formulario.controls.motivo"
          rows="3"
          maxlength="300"
          placeholder="Ejemplo: Ya resolví la falla por otro medio."
        ></textarea>
        <mat-hint>Máximo 300 caracteres.</mat-hint>
        @if (formulario.controls.motivo.hasError('maxlength')) {
          <mat-error>El motivo no puede superar los 300 caracteres.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cerrar()">Volver</button>
      <button mat-flat-button type="button" class="dialogo__confirmar" (click)="confirmar()">
        <mat-icon aria-hidden="true">cancel</mat-icon>
        Sí, cancelar solicitud
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    mat-dialog-content > p {
      color: var(--ft-on-surface-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    .dialogo__confirmar {
      --mat-button-filled-container-color: var(--ft-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class CancelarSolicitudDialog {
  private readonly referencia =
    inject<MatDialogRef<CancelarSolicitudDialog, string | null>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = inject<CancelarSolicitudData>(MAT_DIALOG_DATA);
  protected readonly formulario = this.fb.group({
    motivo: ['', [Validators.maxLength(300)]],
  });

  protected cerrar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const motivo = this.formulario.controls.motivo.value.trim();
    this.referencia.close(motivo === '' ? null : motivo);
  }
}
