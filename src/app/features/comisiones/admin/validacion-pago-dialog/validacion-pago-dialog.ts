import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../../core/http/api-error';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import {
  ETIQUETAS_DECISION_PAGO,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_METODO_PAGO,
  TONOS_ESTADO_PAGO,
} from '../../comision-etiquetas';
import { DecisionPago, PagoComision } from '../../comision.models';
import { AdminComisionesService } from '../../services/admin-comisiones.service';

export interface ValidacionPagoDialogData {
  readonly pago: PagoComision;
  readonly decision: DecisionPago;
}

function observacionRequerida(control: AbstractControl): ValidationErrors | null {
  const valor: unknown = control.value;
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto === '' ? { observacionRequerida: true } : null;
}

@Component({
  selector: 'app-validacion-pago-dialog',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    EstadoBadge,
  ],
  templateUrl: './validacion-pago-dialog.html',
  styleUrl: './validacion-pago-dialog.scss',
})
export class ValidacionPagoDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminComisiones = inject(AdminComisionesService);
  private readonly referencia =
    inject<MatDialogRef<ValidacionPagoDialog, PagoComision | undefined>>(MatDialogRef);
  private readonly data = inject<ValidacionPagoDialogData>(MAT_DIALOG_DATA);

  protected readonly pago = this.data.pago;
  protected readonly decision = this.data.decision;
  protected readonly esRechazo = this.decision === 'RECHAZADO';
  protected readonly etiquetaDecision = ETIQUETAS_DECISION_PAGO[this.decision];
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_PAGO;
  protected readonly tonosEstado = TONOS_ESTADO_PAGO;
  protected readonly etiquetasMetodo = ETIQUETAS_METODO_PAGO;

  protected readonly formulario = this.fb.group({
    observacion: [
      '',
      this.esRechazo
        ? [Validators.maxLength(300), observacionRequerida]
        : [Validators.maxLength(300)],
    ],
    confirmado: [false, [Validators.requiredTrue]],
  });

  protected readonly enviado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected readonly mensajeEfecto = computed(() =>
    this.esRechazo
      ? 'El pago quedará rechazado y sus comisiones seguirán pendientes de pago. El técnico recibirá el motivo.'
      : 'Las comisiones incluidas quedarán pagadas y se recalculará el bloqueo por deuda del técnico. El técnico recibirá una notificación.',
  );

  protected mostrarErrorObservacion(): boolean {
    const control = this.formulario.controls.observacion;
    return (
      (control.touched || this.enviado()) &&
      (control.hasError('observacionRequerida') || control.hasError('maxlength'))
    );
  }

  protected mostrarErrorConfirmacion(): boolean {
    return this.enviado() && this.formulario.controls.confirmado.invalid;
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const observacion = valores.observacion.trim();
    this.enviando.set(true);
    this.adminComisiones
      .validarPago(this.pago.id, {
        estado: this.decision,
        observacion: observacion === '' ? null : observacion,
      })
      .subscribe({
        next: (pago) => {
          this.enviando.set(false);
          this.referencia.close(pago);
        },
        error: (error: unknown) => {
          const apiError = normalizarError(error);
          this.enviando.set(false);
          this.errorServidor.set(apiError.mensaje);
          this.detallesError.set(apiError.detalles);
        },
      });
  }

  protected cancelar(): void {
    this.referencia.close();
  }
}
