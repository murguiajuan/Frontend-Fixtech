import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { Reclamo, ServicioDetalle } from '../servicio.models';
import {
  ETIQUETAS_ESTADO_RECLAMO,
  TONOS_ESTADO_RECLAMO,
  esReclamoActivo,
  puedeCrearReclamo,
  puedeResponderReclamo,
} from '../servicio-etiquetas';
import { ServiciosService } from '../servicios.service';
import { ReclamoDialog, ReclamoDialogData } from './reclamo-dialog';

@Component({
  selector: 'app-reclamos-servicio',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './reclamos-servicio.html',
  styleUrl: './reclamos-servicio.scss',
})
export class ReclamosServicio implements OnInit {
  private readonly servicios = inject(ServiciosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly servicio = input.required<ServicioDetalle>();
  readonly esCliente = input.required<boolean>();
  readonly esTecnico = input.required<boolean>();
  readonly actualizado = output<void>();

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_RECLAMO;
  protected readonly tonosEstado = TONOS_ESTADO_RECLAMO;
  protected readonly esReclamoActivo = esReclamoActivo;

  protected readonly reclamos = signal<readonly Reclamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly creando = signal(false);
  protected readonly respondiendo = signal<number | null>(null);

  protected readonly hayActivo = computed(() =>
    this.reclamos().some((reclamo) => esReclamoActivo(reclamo.estado)),
  );
  protected readonly puedeCrear = computed(
    () =>
      this.esCliente() &&
      !this.cargando() &&
      this.error() === null &&
      puedeCrearReclamo(this.servicio().estado, this.reclamos()),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicios.listarReclamos(this.servicio().id).subscribe({
      next: (reclamos) => {
        this.reclamos.set(reclamos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected abrirReclamo(): void {
    if (this.creando() || !this.puedeCrear()) {
      return;
    }
    this.creando.set(true);
    const referencia: MatDialogRef<ReclamoDialog, Reclamo | undefined> = this.dialog.open<
      ReclamoDialog,
      ReclamoDialogData,
      Reclamo | undefined
    >(ReclamoDialog, {
      data: { servicioId: this.servicio().id },
      width: 'min(94vw, 38rem)',
      maxWidth: '94vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((resultado) => {
      this.creando.set(false);
      if (resultado === undefined) {
        return;
      }
      this.notificaciones.exito('Reclamo registrado. El técnico y administración fueron avisados.');
      this.reclamos.update((actuales) => [resultado, ...actuales]);
      this.actualizado.emit();
    });
  }

  protected responder(reclamo: Reclamo): void {
    if (!this.puedeResponder(reclamo) || this.respondiendo() !== null) {
      return;
    }
    const datos: ConfirmarAccionData = {
      titulo: `Responder reclamo #${reclamo.id}`,
      mensaje: 'Tu respuesta será visible para el cliente y administración.',
      detalle: 'Solo puedes responder una vez. Explica las acciones tomadas o tu posición.',
      icono: 'reply',
      etiquetaConfirmar: 'Publicar respuesta',
      motivo: {
        etiqueta: 'Respuesta al reclamo',
        requerido: true,
        maxLongitud: 1000,
        ayuda: 'Máximo 1000 caracteres.',
      },
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(94vw, 36rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined || resultado.motivo === null) {
        return;
      }
      this.respondiendo.set(reclamo.id);
      this.servicios.responderReclamo(this.servicio().id, reclamo.id, resultado.motivo).subscribe({
        next: (actualizado) => {
          this.respondiendo.set(null);
          this.reclamos.update((actuales) =>
            actuales.map((item) => (item.id === actualizado.id ? actualizado : item)),
          );
          this.notificaciones.exito('Respuesta publicada.');
          this.actualizado.emit();
        },
        error: (error: unknown) => {
          this.respondiendo.set(null);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
    });
  }

  protected puedeResponder(reclamo: Reclamo): boolean {
    return puedeResponderReclamo(reclamo, this.esTecnico());
  }

  protected urlFoto(reclamo: Reclamo, fotoId: number): string {
    return this.servicios.urlFotoReclamo(this.servicio().id, reclamo.id, fotoId);
  }
}
