import { DatePipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
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
  GRUPOS_PARAMETRO,
  GrupoParametros,
  ParametroSistema,
  ParametrosUpdateRequest,
  errorValorParametro,
} from './parametros.models';

type ControlesParametros = Record<ClaveParametro, FormControl<string>>;

interface ParametroVista {
  readonly definicion: DefinicionParametro;
  readonly parametro: ParametroSistema | null;
  readonly cambiado: boolean;
}

interface GrupoVista extends GrupoParametros {
  readonly parametros: readonly ParametroVista[];
  readonly cambios: number;
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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

  protected readonly cargandoInicial = computed(
    () => this.parametrosResource.isLoading() && !this.parametrosResource.hasValue(),
  );

  protected readonly sinParametros = computed(() => {
    const parametros = this.parametrosResource.value();
    return parametros !== undefined && parametros.length === 0;
  });

  private readonly parametrosCargados = computed<readonly ParametroSistema[]>(() =>
    this.parametrosResource.hasValue() ? this.parametrosResource.value() : [],
  );

  private readonly parametrosPorClave = computed<ReadonlyMap<string, ParametroSistema>>(
    () => new Map(this.parametrosCargados().map((parametro) => [parametro.clave, parametro])),
  );

  private readonly cambios = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  protected readonly gruposVista = computed<readonly GrupoVista[]>(() => {
    const valores = this.cambios();
    const porClave = this.parametrosPorClave();
    return GRUPOS_PARAMETRO.map((grupo) => {
      const parametros = DEFINICIONES_PARAMETRO.filter(
        (definicion) => definicion.grupo === grupo.id,
      ).map<ParametroVista>((definicion) => {
        const parametro = porClave.get(definicion.clave) ?? null;
        const valor = (valores[definicion.clave] ?? '').trim();
        const original = parametro?.valor ?? '';
        return { definicion, parametro, cambiado: valor !== original };
      });
      return {
        ...grupo,
        parametros,
        cambios: parametros.filter((parametro) => parametro.cambiado).length,
      };
    });
  });

  protected readonly cambiosPendientes = computed(() =>
    this.gruposVista().reduce((total, grupo) => total + grupo.cambios, 0),
  );

  protected readonly hayCambios = computed(() => this.cambiosPendientes() > 0);

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
    const definicion = DEFINICIONES_PARAMETRO.find(
      (candidata) => candidata.clave === 'comision_porcentaje',
    );
    if (definicion === undefined || errorValorParametro(definicion, valor) !== null) {
      return null;
    }
    return FORMATO_NUMERO.format(Number(valor) * 100);
  }

  protected camposInvalidos(): number {
    return DEFINICIONES_PARAMETRO.filter(
      (definicion) => this.formulario.controls[definicion.clave].invalid,
    ).length;
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocarPrimerInvalido();
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
        this.parametrosResource.set(actualizados);
        this.cargarValores(actualizados);
        this.notificaciones.exito('Los parámetros se actualizaron correctamente.');
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
    this.formulario.markAsUntouched();
    this.enviado.set(false);
  }

  private enfocarPrimerInvalido(): void {
    const definicion = DEFINICIONES_PARAMETRO.find(
      (candidata) => this.formulario.controls[candidata.clave].invalid,
    );
    if (definicion === undefined) {
      return;
    }
    this.host.nativeElement.querySelector<HTMLElement>(`#parametro-${definicion.clave}`)?.focus();
  }
}
