import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface PinInicioData {
  readonly servicioId: number;
  readonly clienteNombre: string;
}

export interface PinInicioResultado {
  readonly pin: string;
  readonly comentario: string | null;
}

@Component({
  selector: 'app-pin-inicio-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Validar PIN e iniciar el servicio</h2>
    <mat-dialog-content>
      <div class="pin__contexto">
        <mat-icon aria-hidden="true">pin</mat-icon>
        <p>
          Solicita a <strong>{{ datos.clienteNombre }}</strong> el PIN de 4 dígitos que aparece en
          su servicio. Al validarlo se registrará el inicio del trabajo.
        </p>
      </div>

      <form [formGroup]="formulario" class="pin__formulario">
        <mat-form-field appearance="outline">
          <mat-label>PIN de inicio</mat-label>
          <input
            matInput
            formControlName="pin"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="4"
            pattern="[0-9]{4}"
            placeholder="0000"
            aria-describedby="ayuda-pin"
          />
          <mat-hint id="ayuda-pin">El PIN tiene exactamente 4 dígitos.</mat-hint>
          @if (formulario.controls.pin.hasError('required') && enviado()) {
            <mat-error>Ingresa el PIN de inicio.</mat-error>
          } @else if (formulario.controls.pin.hasError('pattern')) {
            <mat-error>El PIN debe tener 4 dígitos numéricos.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Comentario (opcional)</mat-label>
          <textarea
            matInput
            formControlName="comentario"
            rows="2"
            maxlength="300"
            placeholder="Detalle del inicio del trabajo."
          ></textarea>
          <mat-hint>Máximo 300 caracteres. Se guardará en el historial del servicio.</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancelar()">Volver</button>
      <button mat-flat-button type="button" (click)="confirmar()">
        <mat-icon aria-hidden="true">play_arrow</mat-icon>
        Validar e iniciar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .pin__contexto {
      display: flex;
      gap: 0.65rem;
      align-items: flex-start;
      padding: 0.75rem;
      border-radius: var(--ft-radius-md);
      background: var(--ft-primary-50);
    }

    .pin__contexto mat-icon {
      color: var(--ft-primary-700);
    }

    .pin__contexto p {
      font-size: 0.86rem;
      line-height: 1.5;
    }

    .pin__formulario {
      display: grid;
      gap: 0.5rem;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }
  `,
})
export class PinInicioDialog {
  private readonly referencia =
    inject<MatDialogRef<PinInicioDialog, PinInicioResultado | undefined>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly datos = inject<PinInicioData>(MAT_DIALOG_DATA);
  protected readonly enviado = signal(false);
  protected readonly formulario = this.fb.group({
    pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    comentario: ['', [Validators.maxLength(300)]],
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
    const valores = this.formulario.getRawValue();
    const comentario = valores.comentario.trim();
    this.referencia.close({
      pin: valores.pin,
      comentario: comentario === '' ? null : comentario,
    });
  }
}
