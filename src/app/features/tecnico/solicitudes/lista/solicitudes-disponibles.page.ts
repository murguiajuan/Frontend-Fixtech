import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../../shared/ui/imagen-autenticada';
import {
  ETIQUETAS_ESTADO_OFERTA,
  TONOS_ESTADO_OFERTA,
  estaActiva,
  puedeVolverAEnviar,
} from '../../../ofertas/oferta-etiquetas';
import { Oferta, SolicitudDisponible } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import {
  ETIQUETAS_URGENCIA,
  TONOS_URGENCIA,
} from '../../../cliente/solicitudes/solicitud-etiquetas';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';

const TAMANO_PAGINA = 6;

@Component({
  selector: 'app-solicitudes-disponibles-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './solicitudes-disponibles.page.html',
  styleUrl: './solicitudes-disponibles.page.scss',
})
export class SolicitudesDisponiblesPage {
  private readonly solicitudesDisponibles = inject(SolicitudesDisponiblesService);
  private readonly ofertasService = inject(OfertasService);

  protected readonly solicitudes = signal<readonly SolicitudDisponible[]>([]);
  protected readonly ofertas = signal<readonly Oferta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly busqueda = signal('');
  protected readonly pagina = signal(1);

  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly tonosUrgencia = TONOS_URGENCIA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasEstadoOferta = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstadoOferta = TONOS_ESTADO_OFERTA;

  protected readonly filtradas = computed(() => {
    const termino = normalizar(this.busqueda());
    if (termino === '') {
      return this.solicitudes();
    }
    return this.solicitudes().filter((solicitud) =>
      [
        solicitud.tipoEquipo,
        solicitud.tipoServicio,
        solicitud.distrito,
        solicitud.descripcion,
        solicitud.marca ?? '',
        solicitud.modelo ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('es-PE')
        .includes(termino),
    );
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / TAMANO_PAGINA)),
  );
  protected readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  protected readonly visibles = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.filtradas().slice(inicio, inicio + TAMANO_PAGINA);
  });
  protected readonly hayBusqueda = computed(() => this.busqueda().trim() !== '');
  protected readonly conOferta = computed(
    () =>
      this.solicitudes().filter((solicitud) => this.ofertaDe(solicitud.id) !== undefined).length,
  );

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      solicitudes: this.solicitudesDisponibles.listar(),
      ofertas: this.ofertasService.listarMias(),
    }).subscribe({
      next: ({ solicitudes, ofertas }) => {
        this.solicitudes.set(solicitudes);
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

  protected actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
    this.pagina.set(1);
  }

  protected limpiarBusqueda(): void {
    this.busqueda.set('');
    this.pagina.set(1);
  }

  protected cambiarPagina(delta: number): void {
    const destino = this.paginaActual() + delta;
    if (destino >= 1 && destino <= this.totalPaginas()) {
      this.pagina.set(destino);
    }
  }

  protected ofertaDe(solicitudId: number): Oferta | undefined {
    return this.ofertas().find((oferta) => oferta.solicitudId === solicitudId);
  }

  protected etiquetaOferta(oferta: Oferta): string {
    if (estaActiva(oferta.estado)) {
      return 'Oferta enviada';
    }
    if (oferta.estado === 'ACEPTADA') {
      return 'Oferta aceptada';
    }
    if (puedeVolverAEnviar(oferta.estado)) {
      return 'Puedes volver a ofertar';
    }
    return this.etiquetasEstadoOferta[oferta.estado];
  }

  protected imagenPrincipal(solicitud: SolicitudDisponible): string | null {
    return solicitud.imagenes[0]?.url ?? null;
  }
}

function normalizar(texto: string): string {
  return texto.trim().toLocaleLowerCase('es-PE');
}
