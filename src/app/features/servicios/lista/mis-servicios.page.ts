import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ETIQUETAS_ESTADO_SERVICIO,
  FILTRO_SERVICIO_TODOS,
  FiltroServicio,
  OPCIONES_FILTRO_SERVICIO,
  TONOS_ESTADO_SERVICIO,
  coincideFiltroServicio,
} from '../servicio-etiquetas';
import { ServicioListado } from '../servicio.models';
import { ServiciosService } from '../servicios.service';

@Component({
  selector: 'app-mis-servicios-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
  ],
  templateUrl: './mis-servicios.page.html',
  styleUrl: './mis-servicios.page.scss',
})
export class MisServiciosPage implements OnInit {
  private readonly serviciosService = inject(ServiciosService);
  private readonly auth = inject(AuthService);

  protected readonly servicios = signal<readonly ServicioListado[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly filtro = signal<FiltroServicio>(FILTRO_SERVICIO_TODOS);

  protected readonly opcionesFiltro = OPCIONES_FILTRO_SERVICIO;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_SERVICIO;
  protected readonly tonosEstado = TONOS_ESTADO_SERVICIO;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  protected readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  protected readonly rutaBase = computed(() =>
    this.esCliente() ? '/app/cliente/servicios' : '/app/tecnico/servicios',
  );
  protected readonly rutaVolver = computed(() =>
    this.esCliente() ? '/app/cliente/solicitudes' : '/app/tecnico/ofertas',
  );
  protected readonly etiquetaVolver = computed(() =>
    this.esCliente() ? 'Mis solicitudes' : 'Mis ofertas',
  );
  protected readonly etiquetaContraparte = computed(() =>
    this.esCliente() ? 'Técnico' : 'Cliente',
  );
  protected readonly serviciosFiltrados = computed(() =>
    this.servicios().filter((servicio) => coincideFiltroServicio(servicio.estado, this.filtro())),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.serviciosService.listarMios().subscribe({
      next: (servicios) => {
        this.servicios.set(servicios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected contar(filtro: FiltroServicio): number {
    return this.servicios().filter((servicio) => coincideFiltroServicio(servicio.estado, filtro))
      .length;
  }

  protected seleccionarFiltro(filtro: FiltroServicio): void {
    this.filtro.set(filtro);
  }
}
