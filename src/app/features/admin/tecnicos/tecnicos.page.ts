import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { normalizarError } from '../../../core/http/api-error';
import {
  ETIQUETAS_ESTADO_VERIFICACION,
  ETIQUETAS_MODALIDAD,
  TONOS_ESTADO_VERIFICACION,
} from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import {
  ESTADOS_VERIFICACION,
  FiltroEstadoVerificacion,
  FiltrosTecnicos,
  TecnicoAdmin,
  TecnicoVerificacionResponse,
  iniciales,
  nombreVisible,
} from '../admin.models';
import { AdminTecnicosService } from '../services/admin-tecnicos.service';
import {
  VerificacionDialog,
  VerificacionDialogData,
} from './verificacion-dialog/verificacion-dialog';

@Component({
  selector: 'app-admin-tecnicos-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
  ],
  templateUrl: './tecnicos.page.html',
  styleUrl: './tecnicos.page.scss',
})
export class AdminTecnicosPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminTecnicos = inject(AdminTecnicosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_VERIFICACION;
  protected readonly tonosEstado = TONOS_ESTADO_VERIFICACION;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly estados = ESTADOS_VERIFICACION;

  protected readonly formularioFiltros = this.fb.group({
    estadoVerificacion: this.fb.control<FiltroEstadoVerificacion>('TODOS'),
    busqueda: this.fb.control('', [Validators.maxLength(120)]),
  });

  private readonly filtrosAplicados = signal<FiltrosTecnicos>({
    estadoVerificacion: 'TODOS',
    busqueda: '',
  });

  protected readonly tecnicosResource = rxResource<readonly TecnicoAdmin[], FiltrosTecnicos>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminTecnicos.listar(params),
  });

  protected readonly error = computed(() => {
    const fallo = this.tecnicosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly hayFiltros = computed(() => {
    const filtros = this.filtrosAplicados();
    return filtros.estadoVerificacion !== 'TODOS' || filtros.busqueda !== '';
  });

  protected readonly expandido = signal<number | null>(null);

  protected aplicarFiltros(): void {
    if (this.formularioFiltros.invalid) {
      this.formularioFiltros.markAllAsTouched();
      return;
    }
    const valores = this.formularioFiltros.getRawValue();
    this.filtrosAplicados.set({
      estadoVerificacion: valores.estadoVerificacion,
      busqueda: valores.busqueda.trim(),
    });
  }

  protected limpiarFiltros(): void {
    this.formularioFiltros.reset({ estadoVerificacion: 'TODOS', busqueda: '' });
    this.filtrosAplicados.set({ estadoVerificacion: 'TODOS', busqueda: '' });
    this.expandido.set(null);
  }

  protected recargar(): void {
    this.tecnicosResource.reload();
  }

  protected alternarDetalle(tecnicoId: number): void {
    this.expandido.update((actual) => (actual === tecnicoId ? null : tecnicoId));
  }

  protected esExpandido(tecnicoId: number): boolean {
    return this.expandido() === tecnicoId;
  }

  protected abrirVerificacion(tecnico: TecnicoAdmin): void {
    this.dialog
      .open<VerificacionDialog, VerificacionDialogData, TecnicoVerificacionResponse>(
        VerificacionDialog,
        {
          data: { tecnico },
          width: 'min(94vw, 34rem)',
          maxWidth: '94vw',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      )
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === undefined) {
          return;
        }
        this.notificaciones.exito(
          `La verificación de ${nombreVisible(tecnico.nombres, tecnico.apellidos, tecnico.correo)} se actualizó.`,
        );
        this.tecnicosResource.reload();
      });
  }

  protected nombre(tecnico: TecnicoAdmin): string {
    return nombreVisible(tecnico.nombres, tecnico.apellidos, tecnico.correo);
  }

  protected inicialesTecnico(tecnico: TecnicoAdmin): string {
    return iniciales(tecnico.nombres, tecnico.apellidos, tecnico.correo);
  }
}
