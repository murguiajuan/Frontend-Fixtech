import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  descargarArchivo,
  nombreArchivoDesdeContentDisposition,
} from '../../../core/http/descarga-archivo';
import { normalizarError } from '../../../core/http/api-error';
import { fechaIsoLocal, rangoMesActual } from '../../../core/models/fechas';
import {
  ETIQUETAS_ESTADO_RECLAMO,
  ETIQUETAS_ESTADO_SERVICIO,
} from '../../servicios/servicio-etiquetas';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AdminReportesService } from '../services/admin-reportes.service';
import {
  DashboardAdmin,
  FiltrosReporte,
  ORDEN_ESTADOS_RECLAMO,
  ORDEN_ESTADOS_SERVICIO,
  ReporteAdmin,
  etiquetaMes,
  validarFiltrosReporte,
} from './reportes.models';

interface MetricaResumen {
  readonly etiqueta: string;
  readonly valor: string;
  readonly detalle: string;
  readonly icono: string;
}

interface ConteoEstadoVista {
  readonly estado: string;
  readonly etiqueta: string;
  readonly cantidad: number;
}

const MONEDA = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMERO = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

function rangoReporteValidator(control: AbstractControl): ValidationErrors | null {
  const desde = control.get('desde')?.value;
  const hasta = control.get('hasta')?.value;
  const mensaje = validarFiltrosReporte(
    typeof desde === 'string' ? desde : '',
    typeof hasta === 'string' ? hasta : '',
  );
  return mensaje === null ? null : { rangoReporte: true };
}

@Component({
  selector: 'app-admin-reportes-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reportes.page.html',
  styleUrl: './reportes.page.scss',
})
export class AdminReportesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminReportes = inject(AdminReportesService);
  private readonly notificaciones = inject(NotificacionService);

  private readonly rangoInicial = rangoMesActual();
  protected readonly formulario = this.fb.group(
    {
      desde: this.fb.control(this.rangoInicial.desde, [Validators.required]),
      hasta: this.fb.control(this.rangoInicial.hasta, [Validators.required]),
    },
    { validators: rangoReporteValidator },
  );

  private readonly filtrosAplicados = signal<FiltrosReporte>(this.rangoInicial);
  protected readonly enviado = signal(false);
  protected readonly exportando = signal(false);
  protected readonly estadosServicio = ORDEN_ESTADOS_SERVICIO;
  protected readonly estadosReclamo = ORDEN_ESTADOS_RECLAMO;
  protected readonly etiquetasEstadoServicio = ETIQUETAS_ESTADO_SERVICIO;
  protected readonly etiquetasEstadoReclamo = ETIQUETAS_ESTADO_RECLAMO;
  protected readonly etiquetaMes = etiquetaMes;

  protected readonly dashboardResource = rxResource({
    stream: () => this.adminReportes.obtenerDashboard(),
  });

  protected readonly reporteResource = rxResource<ReporteAdmin, FiltrosReporte>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminReportes.obtenerReporte(params),
  });

  protected readonly errorDashboard = computed(() => {
    const fallo = this.dashboardResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly errorReporte = computed(() => {
    const fallo = this.reporteResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly dashboard = computed<DashboardAdmin | null>(() =>
    this.dashboardResource.hasValue() ? this.dashboardResource.value() : null,
  );

  protected readonly reporte = computed<ReporteAdmin | null>(() =>
    this.reporteResource.hasValue() ? this.reporteResource.value() : null,
  );

  protected readonly metricasDashboard = computed<readonly MetricaResumen[]>(() => {
    const dashboard = this.dashboard();
    if (dashboard === null) {
      return [];
    }
    return [
      {
        etiqueta: 'Solicitudes registradas',
        valor: NUMERO.format(dashboard.totalSolicitudes),
        detalle: `${dashboard.solicitudesSinOfertas} sin ofertas`,
        icono: 'assignment',
      },
      {
        etiqueta: 'Servicios registrados',
        valor: NUMERO.format(dashboard.totalServicios),
        detalle: `${dashboard.tecnicosActivos} técnicos activos`,
        icono: 'build_circle',
      },
      {
        etiqueta: 'Ingresos por comisiones',
        valor: MONEDA.format(dashboard.ingresoTotalComisiones),
        detalle: `Mes actual: ${MONEDA.format(dashboard.ingresoMesActual)}`,
        icono: 'account_balance_wallet',
      },
      {
        etiqueta: 'Comisiones pendientes',
        valor: NUMERO.format(dashboard.comisionesPendientes),
        detalle: `Deuda: ${MONEDA.format(dashboard.deudaComisionesPendiente)}`,
        icono: 'pending_actions',
      },
      {
        etiqueta: 'Pagos por validar',
        valor: NUMERO.format(dashboard.pagosPorValidar),
        detalle: 'Comprobantes pendientes de revisión',
        icono: 'receipt_long',
      },
      {
        etiqueta: 'Calificación promedio',
        valor: NUMERO.format(dashboard.calificacionPromedio),
        detalle: `${dashboard.totalResenas} reseñas visibles`,
        icono: 'star',
      },
      {
        etiqueta: 'Reseñas reportadas',
        valor: NUMERO.format(dashboard.resenasReportadas),
        detalle: 'Pendientes de moderación',
        icono: 'reviews',
      },
      {
        etiqueta: 'Reclamos abiertos',
        valor: NUMERO.format(dashboard.reclamosAbiertos),
        detalle: 'Abiertos o en revisión',
        icono: 'support_agent',
      },
    ];
  });

  protected readonly metricasReporte = computed<readonly MetricaResumen[]>(() => {
    const reporte = this.reporte();
    if (reporte === null) {
      return [];
    }
    return [
      {
        etiqueta: 'Solicitudes del periodo',
        valor: NUMERO.format(reporte.totalSolicitudes),
        detalle: `${reporte.solicitudesSinOfertas} sin ofertas`,
        icono: 'assignment',
      },
      {
        etiqueta: 'Servicios del periodo',
        valor: NUMERO.format(reporte.totalServicios),
        detalle: `Volumen: ${MONEDA.format(reporte.volumenServicios)}`,
        icono: 'build_circle',
      },
      {
        etiqueta: 'Ingreso FIXTECH',
        valor: MONEDA.format(reporte.ingresoComisiones),
        detalle: 'Comisiones no anuladas',
        icono: 'payments',
      },
      {
        etiqueta: 'Calificación promedio',
        valor: NUMERO.format(reporte.calificacionPromedio),
        detalle: `${reporte.totalResenas} reseñas visibles`,
        icono: 'star',
      },
      {
        etiqueta: 'Reclamos del periodo',
        valor: NUMERO.format(reporte.totalReclamos),
        detalle: 'Registrados en el rango',
        icono: 'support_agent',
      },
    ];
  });

  protected readonly serviciosDashboard = computed<readonly ConteoEstadoVista[]>(() => {
    const conteo = this.dashboard()?.serviciosPorEstado;
    return this.estadosServicio.map((estado) => ({
      estado,
      etiqueta: this.etiquetasEstadoServicio[estado],
      cantidad: conteo?.[estado] ?? 0,
    }));
  });

  protected readonly serviciosReporte = computed<readonly ConteoEstadoVista[]>(() => {
    const conteo = this.reporte()?.serviciosPorEstado;
    return this.estadosServicio.map((estado) => ({
      estado,
      etiqueta: this.etiquetasEstadoServicio[estado],
      cantidad: conteo?.[estado] ?? 0,
    }));
  });

  protected readonly reclamosReporte = computed<readonly ConteoEstadoVista[]>(() => {
    const conteo = this.reporte()?.reclamosPorEstado;
    return this.estadosReclamo.map((estado) => ({
      estado,
      etiqueta: this.etiquetasEstadoReclamo[estado],
      cantidad: conteo?.[estado] ?? 0,
    }));
  });

  protected readonly maxServiciosDashboard = computed(() =>
    Math.max(1, ...this.serviciosDashboard().map((fila) => fila.cantidad)),
  );

  protected readonly maxServiciosReporte = computed(() =>
    Math.max(1, ...this.serviciosReporte().map((fila) => fila.cantidad)),
  );

  protected readonly maxReclamosReporte = computed(() =>
    Math.max(1, ...this.reclamosReporte().map((fila) => fila.cantidad)),
  );

  protected readonly mensajeRango = computed<string | null>(() => {
    const desde = this.formulario.controls.desde;
    const hasta = this.formulario.controls.hasta;
    if (!this.enviado() && !desde.touched && !hasta.touched) {
      return null;
    }
    return validarFiltrosReporte(desde.value, hasta.value);
  });

  protected aplicarRangoMes(): void {
    this.formulario.setValue(rangoMesActual());
    this.aplicarFiltros();
  }

  protected aplicarUltimos30Dias(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29);
    this.formulario.setValue({
      desde: fechaIsoLocal(inicio),
      hasta: fechaIsoLocal(hoy),
    });
    this.aplicarFiltros();
  }

  protected aplicarFiltros(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    this.filtrosAplicados.set({ desde: valores.desde, hasta: valores.hasta });
  }

  protected exportar(): void {
    if (this.exportando()) {
      return;
    }
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const filtros: FiltrosReporte = { desde: valores.desde, hasta: valores.hasta };
    this.filtrosAplicados.set(filtros);
    this.exportando.set(true);
    this.adminReportes.exportarExcel(filtros).subscribe({
      next: (respuesta) => {
        this.exportando.set(false);
        if (respuesta.body === null) {
          this.notificaciones.error('La API no devolvió el archivo del reporte.');
          return;
        }
        const nombre =
          nombreArchivoDesdeContentDisposition(respuesta.headers.get('Content-Disposition')) ??
          `fixtech-reporte-${filtros.desde}-${filtros.hasta}.xlsx`;
        descargarArchivo(respuesta.body, nombre);
        this.notificaciones.exito('El reporte se descargó correctamente.');
      },
      error: (fallo: unknown) => {
        this.exportando.set(false);
        this.notificaciones.error(normalizarError(fallo).mensaje);
      },
    });
  }

  protected recargarDashboard(): void {
    this.dashboardResource.reload();
  }

  protected recargarReporte(): void {
    this.reporteResource.reload();
  }
}
