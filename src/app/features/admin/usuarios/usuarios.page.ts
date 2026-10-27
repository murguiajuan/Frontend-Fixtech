import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth/auth.service';
import { normalizarError } from '../../../core/http/api-error';
import {
  ETIQUETAS_ESTADO_USUARIO,
  ETIQUETAS_ROL,
  TONOS_ESTADO_USUARIO,
} from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import {
  ESTADOS_USUARIO,
  FiltroEstadoUsuario,
  FiltroRol,
  FiltrosUsuarios,
  ROLES,
  UsuarioAdmin,
  iniciales,
  nombreVisible,
} from '../admin.models';
import { AdminUsuariosService } from '../services/admin-usuarios.service';
import {
  EstadoUsuarioDialog,
  EstadoUsuarioDialogData,
} from './estado-usuario-dialog/estado-usuario-dialog';

@Component({
  selector: 'app-admin-usuarios-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
  ],
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.scss',
})
export class AdminUsuariosPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly adminUsuarios = inject(AdminUsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_USUARIO;
  protected readonly tonosEstado = TONOS_ESTADO_USUARIO;
  protected readonly roles = ROLES;
  protected readonly estados = ESTADOS_USUARIO;

  protected readonly formularioFiltros = this.fb.group({
    rol: this.fb.control<FiltroRol>('TODOS'),
    estado: this.fb.control<FiltroEstadoUsuario>('TODOS'),
    busqueda: this.fb.control('', [Validators.maxLength(120)]),
  });

  private readonly filtrosAplicados = signal<FiltrosUsuarios>({
    rol: 'TODOS',
    estado: 'TODOS',
    busqueda: '',
  });

  protected readonly usuariosResource = rxResource<readonly UsuarioAdmin[], FiltrosUsuarios>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminUsuarios.listar(params),
  });

  protected readonly error = computed(() => {
    const fallo = this.usuariosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly hayFiltros = computed(() => {
    const filtros = this.filtrosAplicados();
    return filtros.rol !== 'TODOS' || filtros.estado !== 'TODOS' || filtros.busqueda !== '';
  });

  protected readonly miUsuarioId = computed(() => this.auth.perfil()?.id ?? null);

  protected aplicarFiltros(): void {
    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
      return;
    }
    const valores = this.formularioFiltros.getRawValue();
    this.filtrosAplicados.set({
      rol: valores.rol,
      estado: valores.estado,
      busqueda: valores.busqueda.trim(),
    });
  }

  protected limpiarFiltros(): void {
    this.formularioFiltros.reset({ rol: 'TODOS', estado: 'TODOS', busqueda: '' });
    this.filtrosAplicados.set({ rol: 'TODOS', estado: 'TODOS', busqueda: '' });
  }

  protected recargar(): void {
    this.usuariosResource.reload();
  }

  protected puedeCambiarEstado(usuario: UsuarioAdmin): boolean {
    return usuario.rol !== 'ADMIN' && usuario.id !== this.miUsuarioId();
  }

  protected esCuentaPropia(usuario: UsuarioAdmin): boolean {
    return usuario.id === this.miUsuarioId();
  }

  protected abrirCambioEstado(usuario: UsuarioAdmin): void {
    this.dialog
      .open<EstadoUsuarioDialog, EstadoUsuarioDialogData, UsuarioAdmin>(EstadoUsuarioDialog, {
        data: { usuario },
        width: 'min(94vw, 32rem)',
        maxWidth: '94vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === undefined) {
          return;
        }
        const nombre = nombreVisible(usuario.nombres, usuario.apellidos, usuario.correo);
        this.notificaciones.exito(
          resultado.estado === 'SUSPENDIDO'
            ? `La cuenta de ${nombre} fue suspendida.`
            : `La cuenta de ${nombre} fue activada.`,
        );
        this.usuariosResource.reload();
      });
  }

  protected nombre(usuario: UsuarioAdmin): string {
    return nombreVisible(usuario.nombres, usuario.apellidos, usuario.correo);
  }

  protected inicialesUsuario(usuario: UsuarioAdmin): string {
    return iniciales(usuario.nombres, usuario.apellidos, usuario.correo);
  }

  protected etiquetaAccion(usuario: UsuarioAdmin): string {
    switch (usuario.estado) {
      case 'ACTIVO':
        return 'Suspender';
      case 'SUSPENDIDO':
        return 'Reactivar';
      default:
        return 'Activar';
    }
  }

  protected iconoAccion(usuario: UsuarioAdmin): string {
    return usuario.estado === 'ACTIVO' ? 'block' : 'lock_open';
  }
}
