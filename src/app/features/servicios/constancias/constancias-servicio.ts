import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { Constancia, ServicioDetalle, TipoConstancia } from '../servicio.models';
import {
  ETIQUETAS_TIPO_CONSTANCIA,
  puedeConfirmarConstancia,
  puedeRegistrarConstancia,
  requiereConstanciaEntrega,
  requiereConstanciaRecepcion,
} from '../servicio-etiquetas';
import { ServiciosService } from '../servicios.service';
import { ConstanciaDialog, ConstanciaDialogData } from './constancia-dialog';

@Component({
  selector: 'app-constancias-servicio',
  imports: [DatePipe, MatButtonModule, MatIconModule, EstadoBadge, ImagenAutenticada],
  templateUrl: './constancias-servicio.html',
  styleUrl: './constancias-servicio.scss',
})
export class ConstanciasServicio {
  private readonly servicios = inject(ServiciosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly servicio = input.required<ServicioDetalle>();
  readonly esCliente = input.required<boolean>();
  readonly actualizado = output<void>();

  protected readonly etiquetasTipo = ETIQUETAS_TIPO_CONSTANCIA;
  protected readonly confirmando = signal<number | null>(null);
  protected readonly registrando = signal<TipoConstancia | null>(null);

  protected readonly puedeRegistrarRecepcion = computed(() =>
    puedeRegistrarConstancia(this.servicio(), 'RECEPCION'),
  );
  protected readonly puedeRegistrarEntrega = computed(() =>
    puedeRegistrarConstancia(this.servicio(), 'ENTREGA'),
  );
  protected readonly recepcionPendiente = computed(() =>
    requiereConstanciaRecepcion(this.servicio()),
  );
  protected readonly entregaPendiente = computed(() => requiereConstanciaEntrega(this.servicio()));
  protected readonly hayConstancias = computed(() => this.servicio().constancias.length > 0);

  protected urlFoto(constancia: Constancia, fotoId: number): string {
    return this.servicios.urlFotoConstancia(this.servicio().id, constancia.id, fotoId);
  }

  protected abrirRegistro(tipo: TipoConstancia): void {
    if (this.registrando() !== null) {
      return;
    }
    this.registrando.set(tipo);
    const referencia: MatDialogRef<ConstanciaDialog, Constancia | undefined> = this.dialog.open<
      ConstanciaDialog,
      ConstanciaDialogData,
      Constancia | undefined
    >(ConstanciaDialog, {
      data: { servicioId: this.servicio().id, tipo },
      width: 'min(94vw, 36rem)',
      maxWidth: '94vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((resultado) => {
      this.registrando.set(null);
      if (resultado === undefined) {
        return;
      }
      this.notificaciones.exito(
        `Constancia de ${tipo === 'RECEPCION' ? 'recepción' : 'entrega'} registrada.`,
      );
      this.actualizado.emit();
    });
  }

  protected confirmar(constancia: Constancia): void {
    if (this.confirmando() !== null) {
      return;
    }
    this.confirmando.set(constancia.id);
    this.servicios.confirmarConstancia(this.servicio().id, constancia.id).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.notificaciones.exito('Constancia confirmada.');
        this.actualizado.emit();
      },
      error: (error: unknown) => {
        this.confirmando.set(null);
        this.notificaciones.error(normalizarError(error).mensaje);
      },
    });
  }

  protected puedeConfirmar(constancia: Constancia): boolean {
    return puedeConfirmarConstancia(this.esCliente(), constancia);
  }
}
