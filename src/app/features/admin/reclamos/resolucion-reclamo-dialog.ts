import { Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EstadoReclamo } from '../../servicios/servicio.models';

export type EstadoFinalReclamo = Extract<EstadoReclamo, 'RESUELTO' | 'CERRADO'>;

export interface ResolucionReclamoData {
  readonly estado: EstadoFinalReclamo;
  readonly resolucionActual: string;
}

export interface ResolucionReclamoResultado {
  readonly resolucion: string;
}

@Component({
  selector: 'app-resolucion-reclamo-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ titulo() }}</h2>
    <mat-dialog-content class="resolucion__contenido">
      <div class="resolucion__encabezado">
        <span class="resolucion__icono" aria-hidden="true">
          <mat-icon>{{ icono() }}</mat-icon>
        </span>
        <p>
          La resolución será visible para el cliente y el técnico, y se guardará en el historial del
          reclamo.
        </p>
      </div>

      <form id="form-resolucion" [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
        <mat-form-field appearance="outline">
          <mat-label>Resolución del reclamo</mat-label>
          <textarea
            matInput
            formControlName="resolucion"
            rows="5"
            maxlength="1000"
            placeholder="Describe la decisión y las acciones tomadas."
          ></textarea>
          <mat-hint>Máximo 1000 caracteres. Obligatorio.</mat-hint>
          @if (formulario.controls.resolucion.hasError('required')) {
            <mat-error>La resolución es obligatoria.</mat-error>
          }
          @if (formulario.controls.resolucion.hasError('maxlength')) {
            <mat-error>La resolución no puede superar los 1000 caracteres.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button type="submit" form="form-resolucion">
        <mat-icon aria-hidden="true">{{ icono() }}</mat-icon>
        {{ etiquetaConfirmar() }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .resolucion__contenido {
      display: grid;
      gap: 0.9rem;
      padding-top: 0.4rem;
    }

    .resolucion__encabezado {
      display: flex;
      gap: 0.8rem;
      align-items: flex-start;
    }

    .resolucion__encabezado p {
      color: var(--ft-on-surface-muted);
      font-size: 0.86rem;
      line-height: 1.55;
    }

    .resolucion__icono {
      display: grid;
      flex: 0 0 2.6rem;
      width: 2.6rem;
      height: 2.6rem;
      place-items: center;
      border-radius: 999px;
      background: var(--ft-primary-50);
      color: var(--ft-primary-700);
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }
  `,
})
export class ResolucionReclamoDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly referencia =
    inject<MatDialogRef<ResolucionReclamoDialog, ResolucionReclamoResultado | undefined>>(
      MatDialogRef,
    );
  private readonly datos = inject<ResolucionReclamoData>(MAT_DIALOG_DATA);

  protected readonly formulario = this.fb.group({
    resolucion: [this.datos.resolucionActual, [Validators.required, Validators.maxLength(1000)]],
  });

  protected readonly titulo = computed(() =>
    this.datos.estado === 'RESUELTO' ? 'Resolver reclamo' : 'Cerrar reclamo',
  );
  protected readonly etiquetaConfirmar = computed(() =>
    this.datos.estado === 'RESUELTO' ? 'Resolver reclamo' : 'Cerrar reclamo',
  );
  protected readonly icono = computed(() =>
    this.datos.estado === 'RESUELTO' ? 'task_alt' : 'lock',
  );

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.referencia.close({ resolucion: this.formulario.controls.resolucion.value.trim() });
  }

  protected cancelar(): void {
    this.referencia.close();
  }
}
