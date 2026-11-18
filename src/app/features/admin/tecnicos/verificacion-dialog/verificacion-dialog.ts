import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { normalizarError } from '../../../../core/http/api-error';
import {
  ETIQUETAS_ESTADO_VERIFICACION,
  TONOS_ESTADO_VERIFICACION,
} from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import {
  EstadoVerificacionAccion,
  TecnicoAdmin,
  TecnicoVerificacionResponse,
  VerificacionTecnicoRequest,
  iniciales,
  nombreVisible,
} from '../../admin.models';
import { AdminTecnicosService } from '../../services/admin-tecnicos.service';

export interface VerificacionDialogData {
  readonly tecnico: TecnicoAdmin;
}

interface OpcionVerificacion {
  readonly valor: EstadoVerificacionAccion;
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono: string;
}

const OPCIONES: readonly OpcionVerificacion[] = [
  {
    valor: 'APROBADO',
    titulo: 'Aprobar perfil',
    descripcion: 'El técnico podrá recibir solicitudes y enviar ofertas.',
    icono: 'verified',
  },
  {
    valor: 'OBSERVADO',
    titulo: 'Solicitar correcciones',
    descripcion: 'El técnico verá el motivo y podrá corregir su información.',
    icono: 'rate_review',
  },
  {
    valor: 'RECHAZADO',
    titulo: 'Rechazar perfil',
    descripcion: 'El técnico no podrá operar en la plataforma.',
    icono: 'block',
  },
];

function motivoSegunEstado(control: AbstractControl): ValidationErrors | null {
  const estado = control.parent?.get('estado')?.value;
  if (estado !== 'OBSERVADO' && estado !== 'RECHAZADO') {
    return null;
  }
  const motivo = control.value;
  const texto = typeof motivo === 'string' ? motivo.trim() : '';
  return texto === '' ? { motivoRequerido: true } : null;
}

@Component({
  selector: 'app-verificacion-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    EstadoBadge,
  ],
  templateUrl: './verificacion-dialog.html',
  styleUrl: './verificacion-dialog.scss',
})
export class VerificacionDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminTecnicos = inject(AdminTecnicosService);
  private readonly dialogRef =
    inject<MatDialogRef<VerificacionDialog, TecnicoVerificacionResponse>>(MatDialogRef);
  private readonly data = inject<VerificacionDialogData>(MAT_DIALOG_DATA);

  protected readonly tecnico = this.data.tecnico;
  protected readonly opciones = OPCIONES;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_VERIFICACION;
  protected readonly tonosEstado = TONOS_ESTADO_VERIFICACION;
  protected readonly nombre = nombreVisible(
    this.tecnico.nombres,
    this.tecnico.apellidos,
    this.tecnico.correo,
  );
  protected readonly inicialesTecnico = iniciales(
    this.tecnico.nombres,
    this.tecnico.apellidos,
    this.tecnico.correo,
  );
  private readonly estadoInicial: EstadoVerificacionAccion =
    this.tecnico.estadoVerificacion === 'PENDIENTE' ? 'APROBADO' : this.tecnico.estadoVerificacion;

  protected readonly formulario = this.fb.group({
    estado: this.fb.control<EstadoVerificacionAccion>(this.estadoInicial, [Validators.required]),
    motivo: this.fb.control('', [Validators.maxLength(300), motivoSegunEstado]),
    confirmado: this.fb.control(false, [Validators.requiredTrue]),
  });

  protected readonly estadoSeleccionado = toSignal(this.formulario.controls.estado.valueChanges, {
    initialValue: this.estadoInicial,
  });
  protected readonly sinCambios = computed(
    () => this.estadoSeleccionado() === this.tecnico.estadoVerificacion,
  );
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected readonly etiquetaAccion = computed(() => {
    switch (this.estadoSeleccionado()) {
      case 'OBSERVADO':
        return 'Marcar como observado';
      case 'RECHAZADO':
        return 'Rechazar técnico';
      default:
        return 'Aprobar técnico';
    }
  });

  protected readonly iconoAccion = computed(() => {
    switch (this.estadoSeleccionado()) {
      case 'OBSERVADO':
        return 'rate_review';
      case 'RECHAZADO':
        return 'block';
      default:
        return 'verified';
    }
  });

  protected mostrarErrorMotivo(): boolean {
    const control = this.formulario.controls.motivo;
    return (
      (control.touched || this.enviado()) &&
      (control.hasError('maxlength') || control.hasError('motivoRequerido'))
    );
  }

  protected actualizarValidacionMotivo(): void {
    this.formulario.controls.motivo.updateValueAndValidity();
  }

  protected mostrarErrorConfirmacion(): boolean {
    return this.enviado() && this.formulario.controls.confirmado.invalid;
  }

  protected enviar(): void {
    if (this.enviando() || this.sinCambios()) {
      return;
    }
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const solicitud: VerificacionTecnicoRequest = {
      estado: valores.estado,
      motivo: valores.estado === 'APROBADO' ? null : valores.motivo.trim(),
    };

    this.enviando.set(true);
    this.adminTecnicos.verificar(this.tecnico.id, solicitud).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.dialogRef.close(respuesta);
      },
      error: (error: unknown) => {
        const apiError = normalizarError(error);
        this.errorServidor.set(apiError.mensaje);
        this.detallesError.set(apiError.detalles);
        this.enviando.set(false);
      },
    });
  }

  protected cancelar(): void {
    this.dialogRef.close();
  }
}
