import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../../shared/ui/imagen-autenticada';
import { SolicitudesService } from '../../services/solicitudes.service';
import {
  ETIQUETAS_ESTADO_SOLICITUD,
  ETIQUETAS_URGENCIA,
  FILTRO_TODAS,
  FiltroEstadoSolicitud,
  OPCIONES_FILTRO_ESTADO,
  TONOS_ESTADO_SOLICITUD,
  TONOS_URGENCIA,
} from '../solicitud-etiquetas';
import { EstadoSolicitud, SolicitudResumen } from '../solicitud.models';

const TAMANO_PAGINA = 6;

@Component({
  selector: 'app-solicitudes-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './solicitudes.page.html',
  styleUrl: './solicitudes.page.scss',
})
export class SolicitudesPage {
  private readonly solicitudesService = inject(SolicitudesService);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_SOLICITUD;
  protected readonly tonosEstado = TONOS_ESTADO_SOLICITUD;
  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly tonosUrgencia = TONOS_URGENCIA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly opcionesFiltro = OPCIONES_FILTRO_ESTADO;
  protected readonly filtroTodas = FILTRO_TODAS;

  protected readonly solicitudes = signal<readonly SolicitudResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly filtro = signal<FiltroEstadoSolicitud>(FILTRO_TODAS);
  protected readonly pagina = signal(1);

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.solicitudes().length / TAMANO_PAGINA)),
  );
  protected readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  protected readonly visibles = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.solicitudes().slice(inicio, inicio + TAMANO_PAGINA);
  });
  protected readonly hayFiltro = computed(() => this.filtro() !== FILTRO_TODAS);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const filtro = this.filtro();
    const estado: EstadoSolicitud | undefined = filtro === FILTRO_TODAS ? undefined : filtro;
    this.solicitudesService.listarMias(estado).subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.pagina.set(1);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected filtrar(filtro: FiltroEstadoSolicitud): void {
    if (filtro === this.filtro()) {
      return;
    }
    this.filtro.set(filtro);
    this.cargar();
  }

  protected cambiarPagina(delta: number): void {
    const destino = this.paginaActual() + delta;
    if (destino >= 1 && destino <= this.totalPaginas()) {
      this.pagina.set(destino);
    }
  }
}
