import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ESTADOS_RECLAMO, FiltroEstadoReclamo, FiltrosReclamos } from '../admin.models';
import { AdminReclamosService } from '../services/admin-reclamos.service';
import { CambioEstadoReclamoRequest, Reclamo } from '../../servicios/servicio.models';
import {
  AccionEstadoReclamo,
  ETIQUETAS_ESTADO_RECLAMO,
  TONOS_ESTADO_RECLAMO,
  transicionesReclamo,
} from '../../servicios/servicio-etiquetas';
import {
  ResolucionReclamoData,
  ResolucionReclamoDialog,
  ResolucionReclamoResultado,
} from './resolucion-reclamo-dialog';

@Component({
  selector: 'app-admin-reclamos-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './reclamos.page.html',
  styleUrl: './reclamos.page.scss',
})
export class AdminReclamosPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminReclamos = inject(AdminReclamosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_RECLAMO;
  protected readonly tonosEstado = TONOS_ESTADO_RECLAMO;
  protected readonly estados = ESTADOS_RECLAMO;
  protected readonly transiciones = transicionesReclamo;

  protected readonly formularioFiltros = this.fb.group({
    estado: this.fb.control<FiltroEstadoReclamo>('TODOS'),
  });

  private readonly filtrosAplicados = signal<FiltrosReclamos>({ estado: 'TODOS' });

  protected readonly reclamosResource = rxResource<readonly Reclamo[], FiltrosReclamos>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminReclamos.listar(params),
  });

  protected readonly error = computed(() => {
    const fallo = this.reclamosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly hayFiltros = computed(() => this.filtrosAplicados().estado !== 'TODOS');
  protected readonly expandido = signal<number | null>(null);
  protected readonly detalle = signal<Reclamo | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly errorDetalle = signal<string | null>(null);
  protected readonly cambiando = signal<number | null>(null);

  protected aplicarFiltros(): void {
    this.filtrosAplicados.set({ estado: this.formularioFiltros.getRawValue().estado });
    this.expandido.set(null);
    this.detalle.set(null);
  }

  protected limpiarFiltros(): void {
    this.formularioFiltros.reset({ estado: 'TODOS' });
    this.filtrosAplicados.set({ estado: 'TODOS' });
    this.expandido.set(null);
    this.detalle.set(null);
  }

  protected recargar(): void {
    this.reclamosResource.reload();
    const actual = this.expandido();
    if (actual !== null) {
      this.cargarDetalle(actual);
    }
  }

  protected alternarDetalle(reclamo: Reclamo): void {
    if (this.expandido() === reclamo.id) {
      this.expandido.set(null);
      this.detalle.set(null);
      return;
    }
    this.expandido.set(reclamo.id);
    this.cargarDetalle(reclamo.id);
  }

  protected esExpandido(reclamoId: number): boolean {
    return this.expandido() === reclamoId;
  }

  protected urlFoto(reclamo: Reclamo, fotoId: number): string {
    return this.adminReclamos.urlFoto(reclamo.id, fotoId);
  }

  protected accionar(reclamo: Reclamo, accion: AccionEstadoReclamo): void {
    if (this.cambiando() !== null) {
      return;
    }
    if (accion.estado === 'EN_REVISION') {
      const datos: ConfirmarAccionData = {
        titulo: `Iniciar revisión del reclamo #${reclamo.id}`,
        mensaje: 'El reclamo pasará a revisión y se notificará al cliente y al técnico.',
        detalle: 'Revisa la evidencia y la respuesta del técnico antes de resolverlo.',
        icono: 'manage_search',
        etiquetaConfirmar: 'Iniciar revisión',
      };
      const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
        this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
          data: datos,
          width: 'min(94vw, 34rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        });
      referencia.afterClosed().subscribe((resultado) => {
        if (resultado === undefined) {
          return;
        }
        this.ejecutarCambio(reclamo, { estado: 'EN_REVISION', resolucion: null });
      });
      return;
    }

    if (accion.estado !== 'RESUELTO' && accion.estado !== 'CERRADO') {
      return;
    }

    const referencia: MatDialogRef<
      ResolucionReclamoDialog,
      ResolucionReclamoResultado | undefined
    > = this.dialog.open<
      ResolucionReclamoDialog,
      ResolucionReclamoData,
      ResolucionReclamoResultado | undefined
    >(ResolucionReclamoDialog, {
      data: { estado: accion.estado, resolucionActual: reclamo.resolucion ?? '' },
      width: 'min(94vw, 36rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.ejecutarCambio(reclamo, { estado: accion.estado, resolucion: resultado.resolucion });
    });
  }

  private cargarDetalle(reclamoId: number): void {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    this.adminReclamos.obtener(reclamoId).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: (error: unknown) => {
        this.errorDetalle.set(normalizarError(error).mensaje);
        this.cargandoDetalle.set(false);
      },
    });
  }

  private ejecutarCambio(reclamo: Reclamo, request: CambioEstadoReclamoRequest): void {
    this.cambiando.set(reclamo.id);
    this.adminReclamos.cambiarEstado(reclamo.id, request).subscribe({
      next: (actualizado) => {
        this.cambiando.set(null);
        this.detalle.set(actualizado);
        this.notificaciones.exito(
          request.estado === 'EN_REVISION'
            ? 'El reclamo pasó a revisión.'
            : request.estado === 'RESUELTO'
              ? 'Reclamo resuelto. Se notificó a las partes.'
              : 'Reclamo cerrado.',
        );
        this.reclamosResource.reload();
      },
      error: (error: unknown) => {
        this.cambiando.set(null);
        this.notificaciones.error(normalizarError(error).mensaje);
        this.cargarDetalle(reclamo.id);
      },
    });
  }
}
