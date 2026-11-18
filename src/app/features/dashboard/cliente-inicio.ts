import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { normalizarError } from '../../core/http/api-error';
import { EstadoBadge } from '../../shared/ui/estado-badge';
import { SolicitudesService } from '../cliente/services/solicitudes.service';
import {
  ETIQUETAS_ESTADO_SOLICITUD,
  TONOS_ESTADO_SOLICITUD,
} from '../cliente/solicitudes/solicitud-etiquetas';
import { SolicitudResumen } from '../cliente/solicitudes/solicitud.models';
import { ETIQUETAS_ESTADO_SERVICIO, TONOS_ESTADO_SERVICIO } from '../servicios/servicio-etiquetas';
import { ServicioListado } from '../servicios/servicio.models';
import { ServiciosService } from '../servicios/servicios.service';

const ESTADOS_TERMINALES = new Set(['FINALIZADO', 'CONFIRMADO', 'CALIFICADO', 'CANCELADO']);

@Component({
  selector: 'app-cliente-inicio',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
  ],
  templateUrl: './cliente-inicio.html',
  styleUrl: './cliente-inicio.scss',
})
export class ClienteInicio {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly serviciosService = inject(ServiciosService);

  protected readonly nombre = computed(
    () => this.auth.perfil()?.nombres?.split(' ')[0] || 'bienvenido',
  );
  protected readonly solicitudes = signal<readonly SolicitudResumen[]>([]);
  protected readonly servicios = signal<readonly ServicioListado[]>([]);
  protected readonly cargandoSolicitudes = signal(true);
  protected readonly cargandoServicios = signal(true);
  protected readonly errorSolicitudes = signal<string | null>(null);
  protected readonly errorServicios = signal<string | null>(null);
  protected readonly solicitudesActivas = computed(() =>
    this.solicitudes().filter((s) => s.estado === 'PUBLICADA' || s.estado === 'CON_OFERTAS'),
  );
  protected readonly conOfertas = computed(
    () => this.solicitudes().filter((s) => s.estado === 'CON_OFERTAS').length,
  );
  protected readonly serviciosEnCurso = computed(() =>
    this.servicios().filter((s) => !ESTADOS_TERMINALES.has(s.estado)),
  );
  protected readonly recientes = computed(() =>
    [...this.solicitudes()].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 3),
  );
  protected readonly etiquetasSolicitud = ETIQUETAS_ESTADO_SOLICITUD;
  protected readonly tonosSolicitud = TONOS_ESTADO_SOLICITUD;
  protected readonly etiquetasServicio = ETIQUETAS_ESTADO_SERVICIO;
  protected readonly tonosServicio = TONOS_ESTADO_SERVICIO;

  constructor() {
    this.cargarSolicitudes();
    this.cargarServicios();
  }

  protected cargarSolicitudes(): void {
    this.cargandoSolicitudes.set(true);
    this.errorSolicitudes.set(null);
    this.solicitudesService
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(solicitudes);
          this.cargandoSolicitudes.set(false);
        },
        error: (error: unknown) => {
          this.errorSolicitudes.set(normalizarError(error).mensaje);
          this.cargandoSolicitudes.set(false);
        },
      });
  }

  protected cargarServicios(): void {
    this.cargandoServicios.set(true);
    this.errorServicios.set(null);
    this.serviciosService
      .listarMios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (servicios) => {
          this.servicios.set(servicios);
          this.cargandoServicios.set(false);
        },
        error: (error: unknown) => {
          this.errorServicios.set(normalizarError(error).mensaje);
          this.cargandoServicios.set(false);
        },
      });
  }
}
