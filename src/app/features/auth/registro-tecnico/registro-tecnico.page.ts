import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RegistroTecnicoRequest } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { DistritoCatalogo, EspecialidadCatalogo } from '../../../core/catalogos/catalogo.models';
import { CatalogoService } from '../../../core/catalogos/catalogo.service';
import { esApiError } from '../../../core/http/api-error';
import { Icono } from '../../../shared/ui/icono';

type CampoRegistroTecnico =
  | 'nombres'
  | 'apellidos'
  | 'correo'
  | 'celular'
  | 'dni'
  | 'password'
  | 'confirmarPassword'
  | 'descripcion'
  | 'aniosExperiencia'
  | 'direccionTaller'
  | 'referenciaTaller'
  | 'horarioTaller'
  | 'aceptoTerminos';

type CampoSeleccion = 'especialidadIds' | 'distritoIds';

@Component({
  selector: 'app-registro-tecnico-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Icono,
  ],
  templateUrl: './registro-tecnico.page.html',
  styleUrl: './registro-tecnico.page.scss',
})
export class RegistroTecnicoPage {
  private readonly auth = inject(AuthService);
  private readonly catalogos = inject(CatalogoService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formulario = this.fb.group(
    {
      nombres: ['', [Validators.required, Validators.maxLength(80)]],
      apellidos: ['', [Validators.required, Validators.maxLength(80)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmarPassword: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(1000)]],
      aniosExperiencia: [
        0,
        [Validators.required, Validators.min(0), Validators.max(60), Validators.pattern(/^\d+$/)],
      ],
      ofreceDomicilio: [true],
      ofreceTaller: [false],
      direccionTaller: ['', [Validators.maxLength(200)]],
      referenciaTaller: ['', [Validators.maxLength(200)]],
      horarioTaller: ['', [Validators.maxLength(120)]],
      especialidadIds: this.fb.control<readonly number[]>([], [seleccionRequerida]),
      distritoIds: this.fb.control<readonly number[]>([], [seleccionRequerida]),
      aceptoTerminos: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordsIguales, modalidadRequerida] },
  );

  protected readonly especialidades = signal<readonly EspecialidadCatalogo[]>([]);
  protected readonly distritos = signal<readonly DistritoCatalogo[]>([]);
  protected readonly cargandoCatalogos = signal(true);
  protected readonly errorCatalogos = signal<string | null>(null);
  protected readonly registrando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);
  protected readonly ocultarPassword = signal(true);

  protected readonly catalogoVacio = computed(
    () => this.especialidades().length === 0 || this.distritos().length === 0,
  );
  protected readonly formularioBloqueado = computed(
    () => this.cargandoCatalogos() || this.errorCatalogos() !== null || this.catalogoVacio(),
  );

  constructor() {
    this.cargarCatalogos();
  }

  protected cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set(null);
    forkJoin({
      especialidades: this.catalogos.listarEspecialidades(),
      distritos: this.catalogos.listarDistritos(),
    }).subscribe({
      next: ({ especialidades, distritos }) => {
        this.especialidades.set(especialidades);
        this.distritos.set(distritos);
        this.cargandoCatalogos.set(false);
      },
      error: (error: unknown) => {
        this.errorCatalogos.set(
          esApiError(error)
            ? error.mensaje
            : 'No pudimos cargar las especialidades y distritos. Intenta nuevamente.',
        );
        this.cargandoCatalogos.set(false);
      },
    });
  }

  protected cambiarTaller(ofreceTaller: boolean): void {
    const direccion = this.formulario.controls.direccionTaller;
    if (ofreceTaller) {
      direccion.setValidators([Validators.required, Validators.maxLength(200)]);
    } else {
      direccion.setValidators([Validators.maxLength(200)]);
      direccion.setValue('');
      this.formulario.controls.referenciaTaller.setValue('');
      this.formulario.controls.horarioTaller.setValue('');
    }
    direccion.updateValueAndValidity();
  }

  protected estaSeleccionada(campo: CampoSeleccion, id: number): boolean {
    return this.formulario.controls[campo].value.includes(id);
  }

  protected alternarSeleccion(campo: CampoSeleccion, id: number, marcado: boolean): void {
    const control = this.formulario.controls[campo];
    const actuales = control.value;
    control.setValue(marcado ? [...actuales, id] : actuales.filter((valor) => valor !== id));
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  protected alternarPassword(): void {
    this.ocultarPassword.update((oculto) => !oculto);
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const request: RegistroTecnicoRequest = {
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim().toLowerCase(),
      celular: valores.celular.trim(),
      dni: valores.dni.trim(),
      password: valores.password,
      aceptoTerminos: valores.aceptoTerminos,
      descripcion: textoONulo(valores.descripcion),
      aniosExperiencia: Number(valores.aniosExperiencia),
      ofreceDomicilio: valores.ofreceDomicilio,
      ofreceTaller: valores.ofreceTaller,
      direccionTaller: valores.ofreceTaller ? textoONulo(valores.direccionTaller) : null,
      referenciaTaller: valores.ofreceTaller ? textoONulo(valores.referenciaTaller) : null,
      horarioTaller: valores.ofreceTaller ? textoONulo(valores.horarioTaller) : null,
      especialidadIds: valores.especialidadIds,
      distritoIds: valores.distritoIds,
    };

    this.registrando.set(true);
    this.auth.registrarTecnico(request).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          queryParams: { registrado: 'tecnico' },
        });
      },
      error: (error: unknown) => {
        if (esApiError(error)) {
          this.errorServidor.set(error.mensaje);
          this.detallesError.set(error.detalles);
        } else {
          this.errorServidor.set('No se pudo crear la cuenta de técnico. Intenta nuevamente.');
        }
        this.registrando.set(false);
      },
    });
  }

  protected mostrarError(campo: CampoRegistroTecnico): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorConfirmacion(): boolean {
    const control = this.formulario.controls.confirmarPassword;
    return (control.touched || this.enviado()) && this.formulario.hasError('passwordsDistintas');
  }

  protected mostrarErrorSeleccion(campo: CampoSeleccion): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorModalidad(): boolean {
    return this.formulario.hasError('modalidadRequerida') && this.enviado();
  }
}

function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmarPassword')?.value;
  return password === confirmacion ? null : { passwordsDistintas: true };
}

function modalidadRequerida(control: AbstractControl): ValidationErrors | null {
  const ofreceDomicilio = control.get('ofreceDomicilio')?.value === true;
  const ofreceTaller = control.get('ofreceTaller')?.value === true;
  return ofreceDomicilio || ofreceTaller ? null : { modalidadRequerida: true };
}

function seleccionRequerida(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0
    ? null
    : { seleccionRequerida: true };
}

function textoONulo(valor: string): string | null {
  const texto = valor.trim();
  return texto === '' ? null : texto;
}
