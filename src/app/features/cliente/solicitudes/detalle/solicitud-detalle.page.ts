import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import {
  ETIQUETAS_ESTADO_SOLICITUD,
  ETIQUETAS_URGENCIA,
  TONOS_ESTADO_SOLICITUD,
  TONOS_URGENCIA,
  esCancelable,
  esEditable,
} from '../solicitud-etiquetas';
import { SolicitudDetalle } from '../solicitud.models';
import { CancelarSolicitudData, CancelarSolicitudDialog } from './cancelar-solicitud-dialog';

@Component({
  selector: 'app-solicitud-detalle-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './solicitud-detalle.page.html',
  styleUrl: './solicitud-detalle.page.scss',
})
export class SolicitudDetallePage implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly id = input<string | undefined>(undefined);

  protected readonly solicitud = signal<SolicitudDetalle | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly cancelando = signal(false);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_SOLICITUD;
  protected readonly tonosEstado = TONOS_ESTADO_SOLICITUD;
  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly tonosUrgencia = TONOS_URGENCIA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  protected readonly puedeEditar = computed(() => {
    const solicitud = this.solicitud();
    return solicitud !== null && esEditable(solicitud.estado);
  });
  protected readonly puedeCancelar = computed(() => {
    const solicitud = this.solicitud();
    return solicitud !== null && esCancelable(solicitud.estado);
  });

  ngOnInit(): void {
    const id = this.id();
    if (id !== undefined) {
      this.cargar(Number(id));
    } else {
      this.error.set({
        estado: 0,
        mensaje: 'La solicitud indicada no es válida.',
        detalles: [],
      });
      this.cargando.set(false);
    }
  }

  protected reintentarCarga(): void {
    const id = this.id();
    if (id !== undefined) {
      this.cargar(Number(id));
    }
  }

  protected cargar(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set({
        estado: 0,
        mensaje: 'La solicitud indicada no es válida.',
        detalles: [],
      });
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.solicitudesService.obtener(id).subscribe({
      next: (solicitud) => {
        this.solicitud.set(solicitud);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected cancelar(): void {
    const solicitud = this.solicitud();
    if (solicitud === null || this.cancelando()) {
      return;
    }
    const referencia: MatDialogRef<CancelarSolicitudDialog, string | null> = this.dialog.open<
      CancelarSolicitudDialog,
      CancelarSolicitudData,
      string | null
    >(CancelarSolicitudDialog, {
      data: { id: solicitud.id },
      width: 'min(92vw, 30rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((motivo) => {
      if (motivo === undefined) {
        return;
      }
      this.cancelando.set(true);
      this.solicitudesService.cancelar(solicitud.id, motivo).subscribe({
        next: (actualizada) => {
          this.solicitud.set(actualizada);
          this.cancelando.set(false);
          this.notificaciones.exito('Solicitud cancelada.');
        },
        error: (error: unknown) => {
          const api = normalizarError(error);
          this.cancelando.set(false);
          this.notificaciones.error(api.mensaje);
        },
      });
    });
  }
}
