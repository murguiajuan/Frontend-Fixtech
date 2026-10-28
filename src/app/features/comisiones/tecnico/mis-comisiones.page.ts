import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
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
  METODOS_PAGO_COMISION,
  TONOS_ESTADO_COMISION,
  TONOS_ESTADO_PAGO,
} from '../comision-etiquetas';
import { FiltroEstadoPago, MetodoPagoComision, PagoComision } from '../comision.models';
import { esFechaVencida, formatearMoneda } from '../comision-utils';
import { ComisionesService } from '../services/comisiones.service';

const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024;
const TIPOS_COMPROBANTE: readonly string[] = ['image/jpeg', 'image/png'];

function validarComprobante(control: AbstractControl): ValidationErrors | null {
  const archivo: unknown = control.value;
  if (archivo === null || archivo === undefined) {
    return null;
  }
  if (!(archivo instanceof File)) {
    return { archivoInvalido: true };
  }
  if (!TIPOS_COMPROBANTE.includes(archivo.type)) {
    return { tipoComprobante: true };
  }
  if (archivo.size > MAX_COMPROBANTE_BYTES) {
    return { tamanoComprobante: true };
  }
  return null;
}

@Component({
  selector: 'app-mis-comisiones-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    PercentPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
    EstadoBadge,
  ],
  templateUrl: './mis-comisiones.page.html',
  styleUrl: './mis-comisiones.page.scss',
})
export class MisComisionesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly comisiones = inject(ComisionesService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);
  private readonly archivoInput = viewChild<ElementRef<HTMLInputElement>>('archivoComprobante');

  protected readonly etiquetasEstadoComision = ETIQUETAS_ESTADO_COMISION;
  protected readonly tonosEstadoComision = TONOS_ESTADO_COMISION;
  protected readonly etiquetasEstadoPago = ETIQUETAS_ESTADO_PAGO;
  protected readonly tonosEstadoPago = TONOS_ESTADO_PAGO;
  protected readonly etiquetasMetodoPago = ETIQUETAS_METODO_PAGO;
  protected readonly metodosPago = METODOS_PAGO_COMISION;
  protected readonly estadosPago = ESTADOS_PAGO;

  protected readonly saldoResource = rxResource({
    stream: () => this.comisiones.obtenerMiSaldo(),
  });

  protected readonly formularioFiltro = this.fb.group({
    estado: this.fb.control<FiltroEstadoPago>('TODOS'),
  });

  private readonly filtroPago = signal<FiltroEstadoPago>('TODOS');

  protected readonly pagosResource = rxResource<readonly PagoComision[], FiltroEstadoPago>({
    params: () => this.filtroPago(),
    stream: ({ params }) => this.comisiones.listarPagos(params === 'TODOS' ? undefined : params),
  });

  protected readonly formularioPago = this.fb.group({
    metodo: this.fb.control<MetodoPagoComision>('YAPE', [Validators.required]),
    numeroOperacion: this.fb.control('', [Validators.required, Validators.maxLength(40)]),
    comprobante: new FormControl<File | null>(null, {
      validators: [Validators.required, validarComprobante],
    }),
  });

  protected readonly saldo = computed(() =>
    this.saldoResource.hasValue() ? this.saldoResource.value() : null,
  );
  protected readonly errorSaldo = computed(() => {
    const fallo = this.saldoResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });
  protected readonly errorPagos = computed(() => {
    const fallo = this.pagosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });
  protected readonly pagos = computed(() =>
    this.pagosResource.hasValue() ? this.pagosResource.value() : [],
  );

  protected readonly comisionesPendientes = computed(
    () => this.saldo()?.comisionesPendientes ?? [],
  );
  protected readonly comisionesDisponibles = computed(() => {
    const idsEnPago = this.idsEnPagoActivo();
    return this.comisionesPendientes().filter((comision) => !idsEnPago.has(comision.id));
  });
  protected readonly hayComisionesEnPago = computed(() => {
    const idsEnPago = this.idsEnPagoActivo();
    return this.comisionesPendientes().some((comision) => idsEnPago.has(comision.id));
  });

  protected readonly seleccionadas = signal<readonly number[]>([]);
  protected readonly seleccionadasParaPago = computed(() => {
    const ids = this.seleccionadas();
    return this.comisionesDisponibles().filter((comision) => ids.includes(comision.id));
  });
  protected readonly totalSeleccionado = computed(() =>
    this.seleccionadasParaPago().reduce((total, comision) => total + comision.montoComision, 0),
  );
  protected readonly todasSeleccionadas = computed(() => {
    const disponibles = this.comisionesDisponibles();
    return (
      disponibles.length > 0 &&
      disponibles.every((comision) => this.seleccionadas().includes(comision.id))
    );
  });
  protected readonly seleccionParcial = computed(
    () => this.seleccionadasParaPago().length > 0 && !this.todasSeleccionadas(),
  );

  protected readonly archivoSeleccionado = signal<File | null>(null);
  protected readonly enviado = signal(false);
  protected readonly registrando = signal(false);
  protected readonly errorSeleccion = signal<string | null>(null);
  protected readonly errorPago = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);
  protected readonly expandido = signal<number | null>(null);

  protected readonly hoy = new Date();

  private readonly idsEnPagoActivo = computed(() => {
    const ids = new Set<number>();
    const pagos = this.saldo()?.pagos ?? [];
    for (const pago of pagos) {
      if (pago.estado !== 'PENDIENTE' && pago.estado !== 'VALIDADO') {
        continue;
      }
      for (const comision of pago.comisiones) {
        ids.add(comision.id);
      }
    }
    return ids;
  });

  protected esVencida(fecha: string): boolean {
    return esFechaVencida(fecha, this.hoy);
  }

  protected estaEnPago(comisionId: number): boolean {
    return this.idsEnPagoActivo().has(comisionId);
  }

  protected alternarComision(comisionId: number, marcada: boolean): void {
    this.errorSeleccion.set(null);
    this.seleccionadas.update((actuales) =>
      marcada
        ? actuales.includes(comisionId)
          ? actuales
          : [...actuales, comisionId]
        : actuales.filter((id) => id !== comisionId),
    );
  }

  protected alternarTodas(marcarTodas: boolean): void {
    this.errorSeleccion.set(null);
    this.seleccionadas.set(
      marcarTodas ? this.comisionesDisponibles().map((comision) => comision.id) : [],
    );
  }

  protected cambiarFiltro(): void {
    this.filtroPago.set(this.formularioFiltro.getRawValue().estado);
    this.expandido.set(null);
  }

  protected recargarSaldo(): void {
    this.saldoResource.reload();
  }

  protected recargarPagos(): void {
    this.pagosResource.reload();
  }

  protected recargarTodo(): void {
    this.saldoResource.reload();
    this.pagosResource.reload();
  }

  protected seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    const control = this.formularioPago.controls.comprobante;
    control.setValue(archivo);
    control.markAsTouched();
    this.archivoSeleccionado.set(archivo);
  }

  protected quitarArchivo(): void {
    const control = this.formularioPago.controls.comprobante;
    control.setValue(null);
    control.markAsUntouched();
    this.archivoSeleccionado.set(null);
    const input = this.archivoInput()?.nativeElement;
    if (input !== undefined) {
      input.value = '';
    }
  }

  protected errorComprobante(): string | null {
    const control = this.formularioPago.controls.comprobante;
    if (!control.touched && !this.enviado()) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Adjunta el comprobante del pago en formato JPG o PNG.';
    }
    if (control.hasError('tipoComprobante') || control.hasError('archivoInvalido')) {
      return 'El comprobante debe ser una imagen JPG o PNG.';
    }
    if (control.hasError('tamanoComprobante')) {
      return 'El comprobante no puede superar los 5 MB.';
    }
    return null;
  }

  protected registrarPago(): void {
    this.enviado.set(true);
    this.errorPago.set(null);
    this.detallesError.set([]);
    this.errorSeleccion.set(null);

    const seleccionadas = this.seleccionadasParaPago();
    if (seleccionadas.length === 0) {
      this.errorSeleccion.set('Selecciona al menos una comisión pendiente para pagar.');
      return;
    }
    if (this.formularioPago.invalid) {
      this.formularioPago.markAllAsTouched();
      return;
    }

    const valores = this.formularioPago.getRawValue();
    const comprobante = valores.comprobante;
    if (comprobante === null) {
      return;
    }

    this.registrando.set(true);
    this.comisiones
      .registrarPago({
        comisionIds: seleccionadas.map((comision) => comision.id),
        metodo: valores.metodo,
        numeroOperacion: valores.numeroOperacion.trim(),
        comprobante,
      })
      .subscribe({
        next: () => {
          this.registrando.set(false);
          this.enviado.set(false);
          this.seleccionadas.set([]);
          this.formularioPago.reset({
            metodo: 'YAPE',
            numeroOperacion: '',
            comprobante: null,
          });
          this.archivoSeleccionado.set(null);
          const input = this.archivoInput()?.nativeElement;
          if (input !== undefined) {
            input.value = '';
          }
          this.notificaciones.exito('Pago registrado. Queda pendiente de validación.');
          if (this.filtroPago() !== 'TODOS') {
            this.formularioFiltro.reset({ estado: 'TODOS' });
            this.filtroPago.set('TODOS');
          } else {
            this.pagosResource.reload();
          }
          this.saldoResource.reload();
        },
        error: (error: unknown) => {
          const apiError = normalizarError(error);
          this.registrando.set(false);
          this.errorPago.set(apiError.mensaje);
          this.detallesError.set(apiError.detalles);
          this.saldoResource.reload();
        },
      });
  }

  protected irARegistro(): void {
    const seccion = document.getElementById('registrar-pago');
    if (seccion === null) {
      return;
    }
    seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const titulo = seccion.querySelector<HTMLElement>('h2');
    titulo?.focus({ preventScroll: true });
  }

  protected abrirComprobante(pago: PagoComision): void {
    if (!pago.tieneComprobante) {
      return;
    }
    const datos: ComprobantePagoDialogData = {
      titulo: `Comprobante del pago #${pago.id}`,
      url: this.comisiones.urlComprobante(pago.id),
      alt: `Comprobante del pago #${pago.id}`,
      datos: [
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

  protected alternarComisionesPago(pagoId: number): void {
    this.expandido.set(this.expandido() === pagoId ? null : pagoId);
  }
}
