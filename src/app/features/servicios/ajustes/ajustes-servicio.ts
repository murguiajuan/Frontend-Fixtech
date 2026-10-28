import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AjustePrecio, ServicioDetalle } from '../servicio.models';
import { ETIQUETAS_AJUSTE, TONOS_AJUSTE, permiteProponerAjuste } from '../servicio-etiquetas';
import { ServiciosService } from '../servicios.service';
import {
  AjustePrecioData,
  AjustePrecioDialog,
  AjustePrecioResultado,
} from './ajuste-precio-dialog';

@Component({
  selector: 'app-ajustes-servicio',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule, EstadoBadge, ImagenAutenticada],
  templateUrl: './ajustes-servicio.html',
  styleUrl: './ajustes-servicio.scss',
})
export class AjustesServicio {
  private readonly serviciosService = inject(ServiciosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly servicio = input.required<ServicioDetalle>();
  readonly esCliente = input.required<boolean>();
  readonly actualizado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly etiquetasAjuste = ETIQUETAS_AJUSTE;
  protected readonly tonosAjuste = TONOS_AJUSTE;

  protected readonly pendiente = computed(() => this.servicio().ajustePendiente);
  protected readonly historicos = computed(() =>
    this.servicio().ajustes.filter((ajuste) => ajuste.id !== this.pendiente()?.id),
  );
  protected readonly puedeProponer = computed(
    () =>
      !this.esCliente() &&
      permiteProponerAjuste(this.servicio().estado) &&
      this.pendiente() === null,
  );

  protected urlEvidencia(ajuste: AjustePrecio): string | null {
    return ajuste.tieneEvidencia ? this.serviciosService.urlEvidenciaAjuste(ajuste.id) : null;
  }

  protected proponer(): void {
    if (this.guardando()) {
      return;
    }
    const referencia: MatDialogRef<AjustePrecioDialog, AjustePrecioResultado | undefined> =
      this.dialog.open<AjustePrecioDialog, AjustePrecioData, AjustePrecioResultado | undefined>(
        AjustePrecioDialog,
        {
          data: { montoActual: this.servicio().montoTotal },
          width: 'min(94vw, 36rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      );

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.guardando.set(true);
      const { evidencia, ...request } = resultado;
      this.serviciosService.proponerAjuste(this.servicio().id, request, evidencia).subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificaciones.exito('Ajuste de precio enviado al cliente.');
          this.actualizado.emit();
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
    });
  }

  protected aprobar(ajuste: AjustePrecio): void {
    this.responder(ajuste, 'APROBADO');
  }

  protected rechazar(ajuste: AjustePrecio): void {
    this.responder(ajuste, 'RECHAZADO');
  }

  private responder(ajuste: AjustePrecio, estado: 'APROBADO' | 'RECHAZADO'): void {
    if (this.guardando()) {
      return;
    }
    const aprobar = estado === 'APROBADO';
    const datos: ConfirmarAccionData = {
      titulo: aprobar ? 'Aprobar ajuste de precio' : 'Rechazar ajuste de precio',
      mensaje: aprobar
        ? `El monto del servicio pasará de S/ ${ajuste.montoAnterior.toFixed(2)} a S/ ${ajuste.montoNuevo.toFixed(2)}.`
        : `Se rechazará el nuevo monto de S/ ${ajuste.montoNuevo.toFixed(2)} y el servicio se cancelará.`,
      detalle: aprobar
        ? 'Después de aprobar, el técnico podrá continuar con el diagnóstico o la reparación.'
        : 'Esta acción no se puede deshacer. El técnico verá que el ajuste fue rechazado.',
      icono: aprobar ? 'price_check' : 'cancel',
      etiquetaConfirmar: aprobar ? 'Aprobar ajuste' : 'Rechazar y cancelar',
      peligro: !aprobar,
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(92vw, 30rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.guardando.set(true);
      this.serviciosService.responderAjuste(ajuste.id, { estado }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificaciones.exito(
            aprobar
              ? 'Ajuste aprobado. El monto del servicio fue actualizado.'
              : 'Ajuste rechazado. El servicio fue cancelado.',
          );
          this.actualizado.emit();
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.actualizado.emit();
        },
      });
    });
  }
}
