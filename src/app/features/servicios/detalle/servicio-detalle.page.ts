import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ETIQUETAS_URGENCIA } from '../../cliente/solicitudes/solicitud-etiquetas';
import { AjustesServicio } from '../ajustes/ajustes-servicio';
import { AvancesServicio } from '../avances/avances-servicio';
import { ConstanciasServicio } from '../constancias/constancias-servicio';
import { MensajesServicio } from '../mensajes/mensajes-servicio';
import { ReclamosServicio } from '../reclamos/reclamos-servicio';
import { ResenaServicio } from '../resenas/resena-servicio';
import { ServicioDetalle } from '../servicio.models';
import {
  AccionEstado,
  ETIQUETAS_CANCELADO_POR,
  ETIQUETAS_ESTADO_SERVICIO,
  ETIQUETAS_METODO_PAGO,
  TONOS_ESTADO_SERVICIO,
  esCancelableServicio,
  puedeConfirmarConformidad,
  puedeFinalizarServicio,
  transicionesTecnico,
} from '../servicio-etiquetas';
import { ServiciosService } from '../servicios.service';
import {
  FinalizarServicioData,
  FinalizarServicioDialog,
  FinalizarServicioResultado,
} from './finalizar-servicio-dialog';
import { PinInicioData, PinInicioDialog, PinInicioResultado } from './pin-inicio-dialog';

@Component({
  selector: 'app-servicio-detalle-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    AvancesServicio,
    AjustesServicio,
    ConstanciasServicio,
    ResenaServicio,
    ReclamosServicio,
    MensajesServicio,
  ],
  templateUrl: './servicio-detalle.page.html',
  styleUrl: './servicio-detalle.page.scss',
})
export class ServicioDetallePage implements OnInit {
  private readonly serviciosService = inject(ServiciosService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  readonly id = input<string | undefined>(undefined);

  protected readonly servicio = signal<ServicioDetalle | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly accionEnCurso = signal<string | null>(null);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_SERVICIO;
  protected readonly tonosEstado = TONOS_ESTADO_SERVICIO;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasMetodoPago = ETIQUETAS_METODO_PAGO;
  protected readonly etiquetasCanceladoPor = ETIQUETAS_CANCELADO_POR;
  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;

  protected readonly esCliente = computed(() => this.auth.rol() === 'CLIENTE');
  protected readonly esTecnico = computed(() => this.auth.rol() === 'TECNICO');
  protected readonly rutaBase = computed(() =>
    this.esCliente() ? '/app/cliente/servicios' : '/app/tecnico/servicios',
  );
  protected readonly nombreContraparte = computed(() => {
    const actual = this.servicio();
    if (actual === null) {
      return '';
    }
    return this.esCliente()
      ? `${actual.tecnico.nombres} ${actual.tecnico.apellidos}`.trim()
      : `${actual.cliente.nombres} ${actual.cliente.apellidos}`.trim();
  });
  protected readonly titulo = computed(() => {
    const actual = this.servicio();
    if (actual === null) {
      return 'Servicio';
    }
    const equipo = actual.solicitud.tipoEquipo ?? 'Equipo';
    const tipo = actual.solicitud.tipoServicio ?? 'Servicio técnico';
    return `${equipo} · ${tipo}`;
  });
  protected readonly accionesTecnico = computed<readonly AccionEstado[]>(() => {
    const actual = this.servicio();
    if (actual === null || !this.esTecnico()) {
      return [];
    }
    return transicionesTecnico(actual);
  });
  protected readonly puedeFinalizar = computed(() => {
    const actual = this.servicio();
    return actual !== null && this.esTecnico() && puedeFinalizarServicio(actual);
  });
  protected readonly puedeCancelar = computed(() => {
    const actual = this.servicio();
    return actual !== null && esCancelableServicio(actual.estado);
  });
  protected readonly puedeConfirmar = computed(() => {
    const actual = this.servicio();
    return actual !== null && this.esCliente() && puedeConfirmarConformidad(actual.estado);
  });
  protected readonly ajustePendiente = computed(() => this.servicio()?.ajustePendiente ?? null);
  protected readonly digitosPin = computed(() => this.servicio()?.pinInicio?.split('') ?? []);

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      this.error.set({
        estado: 0,
        mensaje: 'El servicio indicado no es válido.',
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
        mensaje: 'El servicio indicado no es válido.',
        detalles: [],
      });
      this.cargando.set(false);
      return;
    }
    if (this.servicio() === null) {
      this.cargando.set(true);
    }
    this.error.set(null);
    this.serviciosService.obtener(id).subscribe({
      next: (servicio) => {
        this.servicio.set(servicio);
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

  protected recargar(): void {
    const actual = this.servicio();
    if (actual !== null) {
      this.cargar(actual.id);
    }
  }

  protected accionar(accion: AccionEstado): void {
    const actual = this.servicio();
    if (actual === null || this.accionEnCurso() !== null) {
      return;
    }
    if (accion.estado === 'EN_PROCESO' && actual.estado === 'TECNICO_EN_CAMINO') {
      this.abrirPin(actual);
      return;
    }
    this.ejecutarCambio(actual.id, accion.estado, null, null);
  }

  protected finalizar(): void {
    const actual = this.servicio();
    if (actual === null || this.accionEnCurso() !== null) {
      return;
    }
    const referencia: MatDialogRef<
      FinalizarServicioDialog,
      FinalizarServicioResultado | undefined
    > = this.dialog.open<
      FinalizarServicioDialog,
      FinalizarServicioData,
      FinalizarServicioResultado | undefined
    >(FinalizarServicioDialog, {
      data: { servicioId: actual.id, montoTotal: actual.montoTotal },
      width: 'min(94vw, 32rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.accionEnCurso.set('finalizar');
      this.serviciosService
        .finalizar(actual.id, {
          montoFinal: resultado.montoFinal,
          metodoPago: resultado.metodoPago,
        })
        .subscribe({
          next: () => {
            this.accionEnCurso.set(null);
            this.notificaciones.exito(
              'Servicio finalizado. El cliente podrá confirmar su conformidad.',
            );
            this.cargar(actual.id);
          },
          error: (error: unknown) => {
            this.accionEnCurso.set(null);
            this.notificaciones.error(normalizarError(error).mensaje);
          },
        });
    });
  }

  protected cancelar(): void {
    const actual = this.servicio();
    if (actual === null || this.accionEnCurso() !== null) {
      return;
    }
    const datos: ConfirmarAccionData = {
      titulo: `Cancelar servicio #${actual.id}`,
      mensaje:
        'El servicio quedará cancelado para ambas partes y no podrá reactivarse. Explica el motivo de la cancelación.',
      detalle:
        actual.modalidad === 'TALLER'
          ? 'Si el equipo ya está en el taller, coordina su devolución con la otra parte.'
          : 'Si el técnico ya inició el traslado, avísale para evitar que acuda al domicilio.',
      icono: 'cancel',
      etiquetaConfirmar: 'Cancelar servicio',
      peligro: true,
      motivo: {
        etiqueta: 'Motivo de cancelación',
        requerido: true,
        maxLongitud: 300,
        ayuda: 'Máximo 300 caracteres. La otra parte verá este motivo.',
      },
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(92vw, 32rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined || resultado.motivo === null) {
        return;
      }
      this.ejecutarCambio(actual.id, 'CANCELADO', null, null, resultado.motivo);
    });
  }

  protected confirmarConformidad(): void {
    const actual = this.servicio();
    if (actual === null || this.accionEnCurso() !== null) {
      return;
    }
    const datos: ConfirmarAccionData = {
      titulo: 'Confirmar conformidad',
      mensaje: `¿Confirmas que el servicio #${actual.id} fue realizado correctamente?`,
      detalle:
        'Al confirmar, se cerrará el servicio y se registrará la comisión del técnico. Esta acción no se puede deshacer.',
      icono: 'verified',
      etiquetaConfirmar: 'Confirmar conformidad',
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
      this.accionEnCurso.set('conformidad');
      this.serviciosService.confirmar(actual.id).subscribe({
        next: () => {
          this.accionEnCurso.set(null);
          this.notificaciones.exito('Conformidad registrada. ¡Gracias por usar FIXTECH!');
          this.cargar(actual.id);
        },
        error: (error: unknown) => {
          this.accionEnCurso.set(null);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
    });
  }

  private abrirPin(actual: ServicioDetalle): void {
    const referencia: MatDialogRef<PinInicioDialog, PinInicioResultado | undefined> =
      this.dialog.open<PinInicioDialog, PinInicioData, PinInicioResultado | undefined>(
        PinInicioDialog,
        {
          data: {
            servicioId: actual.id,
            clienteNombre: `${actual.cliente.nombres} ${actual.cliente.apellidos}`.trim(),
          },
          width: 'min(94vw, 32rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      );

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.ejecutarCambio(actual.id, 'EN_PROCESO', resultado.pin, resultado.comentario);
    });
  }

  private ejecutarCambio(
    servicioId: number,
    estado: ServicioDetalle['estado'],
    pin: string | null,
    comentario: string | null,
    motivo: string | null = null,
  ): void {
    if (this.accionEnCurso() !== null) {
      return;
    }
    this.accionEnCurso.set(estado);
    this.serviciosService.cambiarEstado(servicioId, { estado, pin, comentario, motivo }).subscribe({
      next: () => {
        this.accionEnCurso.set(null);
        this.notificaciones.exito(
          estado === 'CANCELADO'
            ? 'Servicio cancelado.'
            : `Estado actualizado: ${this.etiquetasEstado[estado]}.`,
        );
        this.cargar(servicioId);
      },
      error: (error: unknown) => {
        this.accionEnCurso.set(null);
        this.notificaciones.error(normalizarError(error).mensaje);
      },
    });
  }
}
