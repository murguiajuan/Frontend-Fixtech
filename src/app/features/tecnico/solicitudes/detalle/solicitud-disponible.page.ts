import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import {
  ETIQUETAS_ESTADO_OFERTA,
  TONOS_ESTADO_OFERTA,
  contraofertaPendiente,
  esperaRespuestaDeLaOtraParte,
  estaActiva,
  puedeResponderContraoferta,
  puedeVolverAEnviar,
} from '../../../ofertas/oferta-etiquetas';
import { Oferta, ContraofertaRequest, SolicitudDisponible } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import {
  ContraofertaData,
  ContraofertaDialog,
} from '../../../ofertas/negociacion/contraoferta-dialog';
import { NegociacionHistorial } from '../../../ofertas/negociacion/negociacion-historial';
import { RetirarOfertaData, RetirarOfertaDialog } from '../../../ofertas/retirar-oferta-dialog';
import {
  ETIQUETAS_URGENCIA,
  TONOS_URGENCIA,
} from '../../../cliente/solicitudes/solicitud-etiquetas';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';

@Component({
  selector: 'app-solicitud-disponible-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
    NegociacionHistorial,
  ],
  templateUrl: './solicitud-disponible.page.html',
  styleUrl: './solicitud-disponible.page.scss',
})
export class SolicitudDisponiblePage implements OnInit {
  private readonly solicitudesDisponibles = inject(SolicitudesDisponiblesService);
  private readonly ofertasService = inject(OfertasService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly id = input<string | undefined>(undefined);

  protected readonly solicitud = signal<SolicitudDisponible | null>(null);
  protected readonly oferta = signal<Oferta | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly retirando = signal(false);
  protected readonly respondiendo = signal(false);

  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly tonosUrgencia = TONOS_URGENCIA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasEstadoOferta = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstadoOferta = TONOS_ESTADO_OFERTA;

  protected readonly ofertaActiva = computed(() => {
    const oferta = this.oferta();
    return oferta !== null && estaActiva(oferta.estado);
  });
  protected readonly puedeCrearOferta = computed(() => {
    const oferta = this.oferta();
    return oferta === null || puedeVolverAEnviar(oferta.estado);
  });
  protected esActiva(estado: Oferta['estado']): boolean {
    return estaActiva(estado);
  }
  protected readonly puedeEditar = computed(() => this.ofertaActiva());
  protected readonly puedeRetirar = computed(() => this.ofertaActiva());
  protected readonly puedeResponder = computed(() => {
    const oferta = this.oferta();
    return oferta !== null && puedeResponderContraoferta(oferta, 'TECNICO');
  });
  protected readonly esperaRespuesta = computed(() => {
    const oferta = this.oferta();
    return oferta !== null && esperaRespuestaDeLaOtraParte(oferta, 'TECNICO');
  });
  protected readonly pendiente = computed(() => {
    const oferta = this.oferta();
    return oferta === null ? null : contraofertaPendiente(oferta);
  });
  protected readonly etiquetaCrear = computed(() =>
    this.oferta() === null ? 'Enviar oferta' : 'Volver a enviar oferta',
  );

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      this.error.set({
        estado: 0,
        mensaje: 'La solicitud indicada no es válida.',
        detalles: [],
      });
      this.cargando.set(false);
      return;
    }
    this.cargar(Number(id));
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
    forkJoin({
      solicitud: this.solicitudesDisponibles.obtener(id),
      ofertas: this.ofertasService.listarMias(),
    }).subscribe({
      next: ({ solicitud, ofertas }) => {
        this.solicitud.set(solicitud);
        this.oferta.set(ofertas.find((oferta) => oferta.solicitudId === id) ?? null);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected reintentarCarga(): void {
    const id = this.id();
    if (id !== undefined) {
      this.cargar(Number(id));
    }
  }

  protected retirar(): void {
    const oferta = this.oferta();
    if (oferta === null || this.retirando()) {
      return;
    }
    const referencia: MatDialogRef<RetirarOfertaDialog, true | undefined> = this.dialog.open<
      RetirarOfertaDialog,
      RetirarOfertaData,
      true | undefined
    >(RetirarOfertaDialog, {
      data: { ofertaId: oferta.id, precioTotal: oferta.precioTotal },
      width: 'min(92vw, 30rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((confirmado) => {
      if (confirmado !== true) {
        return;
      }
      this.retirando.set(true);
      this.ofertasService.retirar(oferta.id).subscribe({
        next: (actualizada) => {
          this.oferta.set(actualizada);
          this.retirando.set(false);
          this.notificaciones.exito('Oferta retirada.');
        },
        error: (error: unknown) => {
          this.retirando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.recargarOferta();
        },
      });
    });
  }

  protected negociar(): void {
    const oferta = this.oferta();
    if (oferta === null || this.respondiendo()) {
      return;
    }
    const referencia: MatDialogRef<ContraofertaDialog, ContraofertaRequest | undefined> =
      this.dialog.open<ContraofertaDialog, ContraofertaData, ContraofertaRequest | undefined>(
        ContraofertaDialog,
        {
          data: { oferta, emisor: 'TECNICO' },
          width: 'min(94vw, 34rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      );

    referencia.afterClosed().subscribe((respuesta) => {
      if (respuesta === undefined) {
        return;
      }
      this.respondiendo.set(true);
      this.ofertasService.responder(oferta.id, respuesta).subscribe({
        next: (resultado) => {
          this.oferta.set(resultado.oferta);
          this.respondiendo.set(false);
          this.notificaciones.exito('Respuesta de negociación registrada.');
        },
        error: (error: unknown) => {
          this.respondiendo.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.recargarOferta();
        },
      });
    });
  }

  protected imagenPrincipal(solicitud: SolicitudDisponible): string | null {
    return solicitud.imagenes[0]?.url ?? null;
  }

  private recargarOferta(): void {
    this.ofertasService.listarMias().subscribe({
      next: (ofertas) => {
        const id = this.solicitud()?.id;
        if (id === undefined) {
          return;
        }
        this.oferta.set(ofertas.find((oferta) => oferta.solicitudId === id) ?? null);
      },
      error: () => undefined,
    });
  }
}
