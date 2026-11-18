import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../../core/http/api-error';
import {
  ETIQUETAS_ESTADO_USUARIO,
  ETIQUETAS_ROL,
  TONOS_ESTADO_USUARIO,
} from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import {
  CambioEstadoUsuarioRequest,
  UsuarioAdmin,
  estadoAccionUsuario,
  iniciales,
  nombreVisible,
} from '../../admin.models';
import { AdminUsuariosService } from '../../services/admin-usuarios.service';

export interface EstadoUsuarioDialogData {
  readonly usuario: UsuarioAdmin;
}

function motivoNoVacio(control: AbstractControl): ValidationErrors | null {
  const motivo = control.value;
  const texto = typeof motivo === 'string' ? motivo.trim() : '';
  return texto === '' ? { motivoRequerido: true } : null;
}

@Component({
  selector: 'app-estado-usuario-dialog',
  imports: [
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
  templateUrl: './estado-usuario-dialog.html',
  styleUrl: './estado-usuario-dialog.scss',
})
export class EstadoUsuarioDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminUsuarios = inject(AdminUsuariosService);
  private readonly dialogRef =
    inject<MatDialogRef<EstadoUsuarioDialog, UsuarioAdmin>>(MatDialogRef);
  private readonly data = inject<EstadoUsuarioDialogData>(MAT_DIALOG_DATA);

  protected readonly usuario = this.data.usuario;
  protected readonly objetivo = estadoAccionUsuario(this.usuario);
  protected readonly suspendiendo = this.objetivo === 'SUSPENDIDO';
  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_USUARIO;
  protected readonly tonosEstado = TONOS_ESTADO_USUARIO;
  protected readonly nombre = nombreVisible(
    this.usuario.nombres,
    this.usuario.apellidos,
    this.usuario.correo,
  );
  protected readonly inicialesUsuario = iniciales(
    this.usuario.nombres,
    this.usuario.apellidos,
    this.usuario.correo,
  );

  protected readonly formulario = this.fb.group({
    motivo: this.fb.control(
      '',
      this.suspendiendo ? [Validators.maxLength(300), motivoNoVacio] : [Validators.maxLength(300)],
    ),
    confirmado: this.fb.control(false, this.suspendiendo ? [Validators.requiredTrue] : []),
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected readonly titulo = this.suspendiendo
    ? 'Suspender cuenta'
    : this.usuario.estado === 'INACTIVO'
      ? 'Activar cuenta'
      : 'Reactivar cuenta';
  protected readonly etiquetaAccion = this.titulo;

  protected mostrarErrorMotivo(): boolean {
    const control = this.formulario.controls.motivo;
    return (
      (control.touched || this.enviado()) &&
      (control.hasError('maxlength') || control.hasError('motivoRequerido'))
    );
  }

  protected mostrarErrorConfirmacion(): boolean {
    return this.enviado() && this.formulario.controls.confirmado.invalid;
  }

  protected enviar(): void {
    if (this.enviando()) {
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
    const solicitud: CambioEstadoUsuarioRequest = {
      estado: this.objetivo,
      motivo: this.suspendiendo ? valores.motivo.trim() : null,
    };

    this.enviando.set(true);
    this.adminUsuarios.cambiarEstado(this.usuario.id, solicitud).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.dialogRef.close(usuario);
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
