import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import {
  ComprobantePagoDialog,
  ComprobantePagoDialogData,
} from '../comprobante-pago-dialog/comprobante-pago-dialog';
import {
  ETIQUETAS_ESTADO_COMISION,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_METODO_PAGO,
  ESTADOS_PAGO,
  TONOS_ESTADO_COMISION,
  TONOS_ESTADO_PAGO,
} from '../comision-etiquetas';
import {
  DecisionPago,
  FiltroEstadoPago,
  FiltrosPagosComision,
  PagoComision,
} from '../comision.models';
import { formatearMoneda } from '../comision-utils';
import { AdminComisionesService } from '../services/admin-comisiones.service';
import {
  ValidacionPagoDialog,
  ValidacionPagoDialogData,
} from './validacion-pago-dialog/validacion-pago-dialog';

@Component({
  selector: 'app-admin-comisiones-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    EstadoBadge,
  ],
  templateUrl: './admin-comisiones.page.html',
  styleUrl: './admin-comisiones.page.scss',
})
export class AdminComisionesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminComisiones = inject(AdminComisionesService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetasEstadoPago = ETIQUETAS_ESTADO_PAGO;
  protected readonly tonosEstadoPago = TONOS_ESTADO_PAGO;
  protected readonly etiquetasEstadoComision = ETIQUETAS_ESTADO_COMISION;
  protected readonly tonosEstadoComision = TONOS_ESTADO_COMISION;
  protected readonly etiquetasMetodoPago = ETIQUETAS_METODO_PAGO;
  protected readonly estadosPago = ESTADOS_PAGO;

  protected readonly formularioFiltros = this.fb.group({
    estado: this.fb.control<FiltroEstadoPago>('TODOS'),
  });

  private readonly filtrosAplicados = signal<FiltrosPagosComision>({ estado: 'TODOS' });

  protected readonly pagosResource = rxResource<readonly PagoComision[], FiltrosPagosComision>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminComisiones.listarPagos(params),
  });

  protected readonly deudoresResource = rxResource({
    stream: () => this.adminComisiones.listarDeudores(),
  });

  protected readonly pagos = computed(() =>
    this.pagosResource.hasValue() ? this.pagosResource.value() : [],
  );
  protected readonly pagosOrdenados = computed(() =>
    [...this.pagos()].sort(
      (a, b) => Number(b.estado === 'PENDIENTE') - Number(a.estado === 'PENDIENTE'),
    ),
  );
  protected readonly porValidar = computed(
    () => this.pagos().filter((pago) => pago.estado === 'PENDIENTE').length,
  );
  protected readonly deudores = computed(() =>
    this.deudoresResource.hasValue() ? this.deudoresResource.value() : [],
  );
  protected readonly totalDeuda = computed(() =>
    this.deudores().reduce((total, deudor) => total + deudor.saldoPendiente, 0),
  );
  protected readonly totalBloqueados = computed(
    () => this.deudores().filter((deudor) => deudor.bloqueadoPorDeuda).length,
  );
  protected readonly totalVencidas = computed(() =>
    this.deudores().reduce((total, deudor) => total + deudor.comisionesVencidas, 0),
  );

  protected readonly errorPagos = computed(() => {
    const fallo = this.pagosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });
  protected readonly errorDeudores = computed(() => {
    const fallo = this.deudoresResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly hayFiltros = computed(() => this.filtrosAplicados().estado !== 'TODOS');
  protected readonly expandido = signal<number | null>(null);

  protected aplicarFiltros(): void {
    this.filtrosAplicados.set(this.formularioFiltros.getRawValue());
    this.expandido.set(null);
  }

  protected limpiarFiltros(): void {
    this.formularioFiltros.reset({ estado: 'TODOS' });
    this.filtrosAplicados.set({ estado: 'TODOS' });
    this.expandido.set(null);
  }

  protected recargarPagos(): void {
    this.pagosResource.reload();
  }

  protected recargarDeudores(): void {
    this.deudoresResource.reload();
  }

  protected recargarTodo(): void {
    this.pagosResource.reload();
    this.deudoresResource.reload();
  }

  protected alternarComisiones(pagoId: number): void {
    this.expandido.set(this.expandido() === pagoId ? null : pagoId);
  }

  protected abrirComprobante(pago: PagoComision): void {
    if (!pago.tieneComprobante) {
      return;
    }
    const datos: ComprobantePagoDialogData = {
      titulo: `Comprobante del pago #${pago.id}`,
      url: this.adminComisiones.urlComprobante(pago.id),
      alt: `Comprobante del pago #${pago.id} de ${pago.tecnicoNombre}`,
      datos: [
        { etiqueta: 'Técnico', valor: pago.tecnicoNombre },
        { etiqueta: 'Monto', valor: formatearMoneda(pago.monto) },
        { etiqueta: 'Método', valor: this.etiquetasMetodoPago[pago.metodo] },
        { etiqueta: 'Operación', valor: pago.numeroOperacion },
        { etiqueta: 'Estado', valor: this.etiquetasEstadoPago[pago.estado] },
      ],
    };
    this.dialog.open<ComprobantePagoDialog, ComprobantePagoDialogData>(ComprobantePagoDialog, {
      data: datos,
      width: 'min(94vw, 44rem)',
      maxWidth: '94vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  protected validarPago(pago: PagoComision, decision: DecisionPago): void {
    const referencia: MatDialogRef<ValidacionPagoDialog, PagoComision | undefined> =
      this.dialog.open<ValidacionPagoDialog, ValidacionPagoDialogData, PagoComision | undefined>(
        ValidacionPagoDialog,
        {
          data: { pago, decision },
          width: 'min(94vw, 38rem)',
          maxWidth: '94vw',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      );

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.notificaciones.exito(
        decision === 'VALIDADO'
          ? 'Pago validado y comisiones actualizadas.'
          : 'Pago rechazado. El técnico podrá corregirlo.',
      );
      this.recargarTodo();
    });
  }
}
