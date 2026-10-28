import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../core/http/api-error';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AdminParametrosService } from '../services/admin-parametros.service';
import {
  ClaveParametro,
  DEFINICIONES_PARAMETRO,
  DefinicionParametro,
  ParametroSistema,
  ParametrosUpdateRequest,
  errorValorParametro,
} from './parametros.models';

type ControlesParametros = Record<ClaveParametro, FormControl<string>>;

interface ParametroVista {
  readonly definicion: DefinicionParametro;
  readonly parametro: ParametroSistema | null;
}

const FORMATO_NUMERO = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 });

function validadorParametro(definicion: DefinicionParametro): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = typeof control.value === 'string' ? control.value : '';
    return errorValorParametro(definicion, valor) === null ? null : { parametroInvalido: true };
  };
}

@Component({
  selector: 'app-admin-parametros-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './parametros.page.html',
  styleUrl: './parametros.page.scss',
})
export class AdminParametrosPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminParametros = inject(AdminParametrosService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly definiciones = DEFINICIONES_PARAMETRO;
  protected readonly formulario = this.crearFormulario();
  protected readonly enviado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected readonly parametrosResource = rxResource({
    stream: () => this.adminParametros.listar(),
  });

  protected readonly error = computed(() => {
    const fallo = this.parametrosResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly sinParametros = computed(() => {
    const parametros = this.parametrosResource.value();
    return parametros !== undefined && parametros.length === 0;
  });

  private readonly parametrosCargados = computed<readonly ParametroSistema[]>(() =>
    this.parametrosResource.hasValue() ? this.parametrosResource.value() : [],
  );

  protected readonly parametrosVista = computed<readonly ParametroVista[]>(() => {
    const porClave = new Map(
      this.parametrosCargados().map((parametro) => [parametro.clave, parametro]),
    );
    return DEFINICIONES_PARAMETRO.map((definicion) => ({
      definicion,
      parametro: porClave.get(definicion.clave) ?? null,
    }));
  });

  private readonly cambios = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly hayCambios = computed(() => {
    const valores = this.cambios();
    const porClave = new Map(
      this.parametrosCargados().map((parametro) => [parametro.clave, parametro.valor]),
    );
    return DEFINICIONES_PARAMETRO.some(
      (definicion) =>
        (valores[definicion.clave] ?? '').trim() !== (porClave.get(definicion.clave) ?? ''),
    );
  });

  protected readonly cambiosPendientes = computed(() => {
    const valores = this.cambios();
    const porClave = new Map(
      this.parametrosCargados().map((parametro) => [parametro.clave, parametro.valor]),
    );
    return DEFINICIONES_PARAMETRO.filter(
      (definicion) =>
        (valores[definicion.clave] ?? '').trim() !== (porClave.get(definicion.clave) ?? ''),
    ).length;
  });

  constructor() {
    effect(() => {
      if (this.parametrosResource.hasValue()) {
        this.cargarValores(this.parametrosResource.value());
      }
    });
  }

  protected mensajeError(definicion: DefinicionParametro): string | null {
    const control = this.formulario.controls[definicion.clave];
    if (!control.touched && !this.enviado()) {
      return null;
    }
    return errorValorParametro(definicion, control.value);
  }

  protected rango(definicion: DefinicionParametro): string {
    const sufijo = definicion.unidad === null ? '' : ` ${definicion.unidad}`;
    return `Valor permitido: ${FORMATO_NUMERO.format(definicion.minimo)} a ${FORMATO_NUMERO.format(
      definicion.maximo,
    )}${sufijo}.`;
  }

  protected porcentajeComision(): string | null {
    const valor = this.formulario.controls.comision_porcentaje.value.trim();
    const definicion = DEFINICIONES_PARAMETRO[0];
    if (errorValorParametro(definicion, valor) !== null) {
      return null;
    }
    return FORMATO_NUMERO.format(Number(valor) * 100);
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const porClave = new Map(
      this.parametrosCargados().map((parametro) => [parametro.clave, parametro.valor]),
    );
    const actualizaciones = DEFINICIONES_PARAMETRO.filter(
      (definicion) =>
        (valores[definicion.clave] ?? '').trim() !== (porClave.get(definicion.clave) ?? ''),
    ).map((definicion) => ({
      clave: definicion.clave,
      valor: (valores[definicion.clave] ?? '').trim(),
    }));

    if (actualizaciones.length === 0) {
      return;
    }

    const solicitud: ParametrosUpdateRequest = { parametros: actualizaciones };
    this.guardando.set(true);
    this.adminParametros.actualizar(solicitud).subscribe({
      next: (actualizados) => {
        this.guardando.set(false);
        this.cargarValores(actualizados);
        this.notificaciones.exito('Los parámetros se actualizaron correctamente.');
        this.parametrosResource.reload();
      },
      error: (fallo: unknown) => {
        const apiError = normalizarError(fallo);
        this.errorServidor.set(apiError.mensaje);
        this.detallesError.set(apiError.detalles);
        this.guardando.set(false);
      },
    });
  }

  protected descartar(): void {
    if (!this.parametrosResource.hasValue()) {
      return;
    }
    this.errorServidor.set(null);
    this.detallesError.set([]);
    this.enviado.set(false);
    this.cargarValores(this.parametrosResource.value());
  }

  protected recargar(): void {
    this.parametrosResource.reload();
  }

  private crearFormulario(): FormGroup<ControlesParametros> {
    const controles = {} as ControlesParametros;
    for (const definicion of DEFINICIONES_PARAMETRO) {
      controles[definicion.clave] = this.fb.control('', [validadorParametro(definicion)]);
    }
    return new FormGroup(controles);
  }

  private cargarValores(parametros: readonly ParametroSistema[]): void {
    const porClave = new Map(parametros.map((parametro) => [parametro.clave, parametro.valor]));
    for (const definicion of DEFINICIONES_PARAMETRO) {
      this.formulario.controls[definicion.clave].setValue(porClave.get(definicion.clave) ?? '');
    }
    this.formulario.markAsPristine();
    this.enviado.set(false);
  }
}
