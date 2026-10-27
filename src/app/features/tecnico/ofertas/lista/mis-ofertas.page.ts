import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import {
  ETIQUETAS_ESTADO_OFERTA,
  TONOS_ESTADO_OFERTA,
  contraofertaPendiente,
  esperaRespuestaDeLaOtraParte,
  estaActiva,
  puedeResponderContraoferta,
} from '../../../ofertas/oferta-etiquetas';
import { Contraoferta, ContraofertaRequest, Oferta } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import {
  ContraofertaData,
  ContraofertaDialog,
} from '../../../ofertas/negociacion/contraoferta-dialog';
import { NegociacionHistorial } from '../../../ofertas/negociacion/negociacion-historial';
import { RetirarOfertaData, RetirarOfertaDialog } from '../../../ofertas/retirar-oferta-dialog';

const TAMANO_PAGINA = 6;
const FILTRO_TODAS = 'TODAS';
type FiltroOferta = Oferta['estado'] | typeof FILTRO_TODAS;

interface OpcionFiltro {
  readonly valor: FiltroOferta;
  readonly etiqueta: string;
}

const OPCIONES_FILTRO: readonly OpcionFiltro[] = [
  { valor: FILTRO_TODAS, etiqueta: 'Todas' },
  { valor: 'ENVIADA', etiqueta: 'Enviadas' },
  { valor: 'CONTRAOFERTADA', etiqueta: 'En negociación' },
  { valor: 'ACEPTADA', etiqueta: 'Aceptadas' },
  { valor: 'RECHAZADA', etiqueta: 'Rechazadas' },
  { valor: 'RETIRADA', etiqueta: 'Retiradas' },
  { valor: 'EXPIRADA', etiqueta: 'Expiradas' },
];

@Component({
  selector: 'app-mis-ofertas-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    NegociacionHistorial,
  ],
  templateUrl: './mis-ofertas.page.html',
  styleUrl: './mis-ofertas.page.scss',
})
export class MisOfertasPage {
  private readonly ofertasService = inject(OfertasService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly ofertas = signal<readonly Oferta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly filtro = signal<FiltroOferta>(FILTRO_TODAS);
  protected readonly pagina = signal(1);
  protected readonly retirandoId = signal<number | null>(null);
  protected readonly respondiendoId = signal<number | null>(null);

  protected readonly opcionesFiltro = OPCIONES_FILTRO;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstado = TONOS_ESTADO_OFERTA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  protected readonly ordenadas = computed(() =>
    [...this.ofertas()].sort(
      (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
    ),
  );
  protected readonly filtradas = computed(() => {
    const filtro = this.filtro();
    const ofertas = this.ordenadas();
    return filtro === FILTRO_TODAS ? ofertas : ofertas.filter((oferta) => oferta.estado === filtro);
  });
  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / TAMANO_PAGINA)),
  );
  protected readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  protected readonly visibles = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.filtradas().slice(inicio, inicio + TAMANO_PAGINA);
  });

  protected readonly activas = computed(
    () => this.ofertas().filter((oferta) => estaActiva(oferta.estado)).length,
  );
  protected readonly pendientes = computed(
    () =>
      this.ofertas().filter(
        (oferta) =>
          estaActiva(oferta.estado) && contraofertaPendiente(oferta)?.emisor === 'CLIENTE',
      ).length,
  );
  protected readonly aceptadas = computed(
    () => this.ofertas().filter((oferta) => oferta.estado === 'ACEPTADA').length,
  );

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.ofertasService.listarMias().subscribe({
      next: (ofertas) => {
        this.ofertas.set(ofertas);
        this.pagina.set(1);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected cambiarFiltro(filtro: FiltroOferta): void {
    this.filtro.set(filtro);
    this.pagina.set(1);
  }

  protected contar(filtro: FiltroOferta): number {
    return filtro === FILTRO_TODAS
      ? this.ofertas().length
      : this.ofertas().filter((oferta) => oferta.estado === filtro).length;
  }

  protected cambiarPagina(delta: number): void {
    const destino = this.paginaActual() + delta;
    if (destino >= 1 && destino <= this.totalPaginas()) {
      this.pagina.set(destino);
    }
  }

  protected puedeEditar(oferta: Oferta): boolean {
    return estaActiva(oferta.estado);
  }

  protected puedeRetirar(oferta: Oferta): boolean {
    return estaActiva(oferta.estado);
  }

  protected puedeVerSolicitud(oferta: Oferta): boolean {
    return (
      estaActiva(oferta.estado) || oferta.estado === 'RECHAZADA' || oferta.estado === 'RETIRADA'
    );
  }

  protected puedeResponder(oferta: Oferta): boolean {
    return puedeResponderContraoferta(oferta, 'TECNICO');
  }

  protected esperaRespuesta(oferta: Oferta): boolean {
    return esperaRespuestaDeLaOtraParte(oferta, 'TECNICO');
  }

  protected pendiente(oferta: Oferta): Contraoferta | null {
    return contraofertaPendiente(oferta);
  }

  protected retirar(oferta: Oferta): void {
    if (this.retirandoId() !== null) {
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
      this.retirandoId.set(oferta.id);
      this.ofertasService.retirar(oferta.id).subscribe({
        next: (actualizada) => {
          this.reemplazar(actualizada);
          this.retirandoId.set(null);
          this.notificaciones.exito('Oferta retirada.');
        },
        error: (error: unknown) => {
          this.retirandoId.set(null);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.cargar();
        },
      });
    });
  }

  protected negociar(oferta: Oferta): void {
    if (this.respondiendoId() !== null) {
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
      this.respondiendoId.set(oferta.id);
      this.ofertasService.responder(oferta.id, respuesta).subscribe({
        next: (resultado) => {
          this.reemplazar(resultado.oferta);
          this.respondiendoId.set(null);
          this.notificaciones.exito('Respuesta de negociación registrada.');
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
