import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { EstadoSolicitud } from '../../cliente/solicitudes/solicitud.models';
import { CompararOfertasData, CompararOfertasDialog } from '../comparar/comparar-ofertas-dialog';
import { ContraofertaData, ContraofertaDialog } from '../negociacion/contraoferta-dialog';
import { NegociacionHistorial } from '../negociacion/negociacion-historial';
import {
  ETIQUETAS_ESTADO_OFERTA,
  ETIQUETAS_ORDEN,
  ORDENES_OFERTA,
  TONOS_ESTADO_OFERTA,
  contraofertaPendiente,
  esperaRespuestaDeLaOtraParte,
  estaActiva,
  puedeIniciarContraoferta,
  puedeResponderContraoferta,
} from '../oferta-etiquetas';
import { Contraoferta, ContraofertaRequest, Oferta, OfertaOrden } from '../oferta.models';
import { OfertasService } from '../ofertas.service';

@Component({
  selector: 'app-ofertas-recibidas',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
    NegociacionHistorial,
  ],
  templateUrl: './ofertas-recibidas.html',
  styleUrl: './ofertas-recibidas.scss',
})
export class OfertasRecibidas implements OnInit {
  private readonly ofertasService = inject(OfertasService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly solicitudId = input.required<number>();
  readonly estadoSolicitud = input.required<EstadoSolicitud>();
  readonly servicioCreado = output<number>();

  protected readonly ofertas = signal<readonly Oferta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly orden = signal<OfertaOrden>('PRECIO');
  protected readonly seleccionadas = signal<readonly number[]>([]);
  protected readonly comparando = signal(false);
  protected readonly respondiendoId = signal<number | null>(null);

  protected readonly opcionesOrden = ORDENES_OFERTA;
  protected readonly etiquetasOrden = ETIQUETAS_ORDEN;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstado = TONOS_ESTADO_OFERTA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  protected readonly ofertasActivas = computed(() =>
    this.ofertas().filter((oferta) => estaActiva(oferta.estado)),
  );
  protected readonly puedeNegociar = computed(
    () => this.estadoSolicitud() === 'PUBLICADA' || this.estadoSolicitud() === 'CON_OFERTAS',
  );
  protected readonly puedeComparar = computed(
    () => this.ofertasActivas().length >= 2 && this.seleccionadas().length >= 2,
  );
  protected readonly servicioConfirmado = computed(() =>
    this.ofertas().find((oferta) => oferta.estado === 'ACEPTADA'),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.seleccionadas.set([]);
    this.ofertasService.listarDelCliente(this.solicitudId(), this.orden()).subscribe({
      next: (ofertas) => {
        this.ofertas.set(ofertas);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected cambiarOrden(orden: OfertaOrden): void {
    if (this.orden() === orden) {
      return;
    }
    this.orden.set(orden);
    this.cargar();
  }

  protected puedeSeleccionar(oferta: Oferta): boolean {
    return (
      estaActiva(oferta.estado) &&
      (this.seleccionadas().includes(oferta.id) || this.seleccionadas().length < 3)
    );
  }

  protected esActiva(estado: Oferta['estado']): boolean {
    return estaActiva(estado);
  }

  protected estaSeleccionada(oferta: Oferta): boolean {
    return this.seleccionadas().includes(oferta.id);
  }

  protected alternarSeleccion(oferta: Oferta): void {
    if (!this.puedeSeleccionar(oferta)) {
      return;
    }
    this.seleccionadas.update((seleccionadas) =>
      seleccionadas.includes(oferta.id)
        ? seleccionadas.filter((id) => id !== oferta.id)
        : [...seleccionadas, oferta.id],
    );
  }

  protected comparar(): void {
    if (!this.puedeComparar() || this.comparando()) {
      return;
    }
    this.comparando.set(true);
    this.ofertasService.comparar(this.solicitudId(), this.seleccionadas()).subscribe({
      next: (ofertas) => {
        this.comparando.set(false);
        this.dialog.open<CompararOfertasDialog, CompararOfertasData>(CompararOfertasDialog, {
          data: { ofertas },
          width: 'min(96vw, 62rem)',
          maxWidth: '96vw',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        });
      },
      error: (error: unknown) => {
        this.comparando.set(false);
        this.notificaciones.error(normalizarError(error).mensaje);
      },
    });
  }

  protected puedeIniciar(oferta: Oferta): boolean {
    return this.puedeNegociar() && puedeIniciarContraoferta(oferta, 'CLIENTE');
  }

  protected puedeResponder(oferta: Oferta): boolean {
    return this.puedeNegociar() && puedeResponderContraoferta(oferta, 'CLIENTE');
  }

  protected esperaRespuesta(oferta: Oferta): boolean {
    return esperaRespuestaDeLaOtraParte(oferta, 'CLIENTE');
  }

  protected pendiente(oferta: Oferta): Contraoferta | null {
    return contraofertaPendiente(oferta);
  }

  protected negociar(oferta: Oferta): void {
    if (this.respondiendoId() !== null) {
      return;
    }
    const referencia: MatDialogRef<ContraofertaDialog, ContraofertaRequest | undefined> =
      this.dialog.open<ContraofertaDialog, ContraofertaData, ContraofertaRequest | undefined>(
        ContraofertaDialog,
        {
          data: { oferta, emisor: 'CLIENTE' },
          width: 'min(94vw, 34rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      );

    referencia.afterClosed().subscribe((respuesta) => {
      if (respuesta === undefined) {
        return;
      }
      this.respondiendoId.set(oferta.id);
      this.ofertasService.responder(oferta.id, respuesta).subscribe({
        next: (resultado) => {
          this.respondiendoId.set(null);
          this.reemplazar(resultado.oferta);
          if (resultado.servicio !== null) {
            this.notificaciones.exito(
              'Servicio creado. El técnico fue notificado y el resto de ofertas se cerró.',
            );
            this.servicioCreado.emit(resultado.servicio.id);
            this.cargar();
          } else {
            this.notificaciones.exito('Respuesta de negociación registrada.');
          }
        },
        error: (error: unknown) => {
          this.respondiendoId.set(null);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.cargar();
        },
      });
    });
  }

  private reemplazar(actualizada: Oferta): void {
    this.ofertas.update((ofertas) =>
      ofertas.map((oferta) => (oferta.id === actualizada.id ? actualizada : oferta)),
    );
  }
}
