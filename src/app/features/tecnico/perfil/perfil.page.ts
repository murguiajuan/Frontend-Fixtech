import { CurrencyPipe, DecimalPipe } from '@angular/common';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EstadoVerificacion, PerfilTecnicoRequest } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { CatalogoService } from '../../../core/catalogos/catalogo.service';
import { DistritoCatalogo, EspecialidadCatalogo } from '../../../core/catalogos/catalogo.models';
import { normalizarError } from '../../../core/http/api-error';
import {
  ETIQUETAS_ESTADO_USUARIO,
  ETIQUETAS_ESTADO_VERIFICACION,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_ROL,
  TONOS_ESTADO_VERIFICACION,
} from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { PerfilTecnicoService } from '../services/perfil-tecnico.service';

interface MensajeEstado {
  readonly titulo: string;
  readonly mensaje: string;
  readonly icono: string;
}

type CampoPerfil =
  | 'nombres'
  | 'apellidos'
  | 'dni'
  | 'celular'
  | 'descripcion'
  | 'aniosExperiencia'
  | 'garantiaDiasDefecto'
  | 'direccionTaller'
  | 'referenciaTaller'
  | 'horarioTaller';

type CampoSeleccion = 'especialidadIds' | 'distritoIds';

const MAXIMO_FOTO_BYTES = 5 * 1024 * 1024;
const TIPOS_FOTO = ['image/jpeg', 'image/png'];

const MENSAJES_ESTADO: Record<EstadoVerificacion, MensajeEstado> = {
  PENDIENTE: {
    titulo: 'Tu perfil está en revisión',
    mensaje:
      'Un administrador revisará tus datos y tu experiencia. Mientras tanto puedes iniciar sesión, pero aún no recibirás solicitudes ni podrás enviar ofertas.',
    icono: 'hourglass_top',
  },
  APROBADO: {
    titulo: 'Tu perfil está aprobado',
    mensaje:
      'Tu perfil pasó la verificación. Ya puedes recibir solicitudes compatibles y enviar ofertas mientras no tengas bloqueos pendientes.',
    icono: 'verified',
  },
  OBSERVADO: {
    titulo: 'Tu perfil necesita correcciones',
    mensaje:
      'El administrador observó tu perfil. Revisa el motivo y actualiza tus datos desde esta pantalla. Al guardar cambios, tu perfil volverá a revisión.',
    icono: 'report_problem',
  },
  RECHAZADO: {
    titulo: 'Tu perfil no fue aprobado',
    mensaje:
      'La verificación no fue aprobada. Revisa el motivo y actualiza tu información si necesitas corregirla; al guardar, tu perfil volverá a revisión.',
    icono: 'cancel',
  },
};

@Component({
  selector: 'app-perfil-tecnico-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
})
export class PerfilTecnicoPage {
  private readonly auth = inject(AuthService);
  private readonly perfilService = inject(PerfilTecnicoService);
  private readonly catalogos = inject(CatalogoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly perfil = this.auth.perfil;
  protected readonly tecnico = computed(() => this.perfil()?.tecnico ?? null);
  protected readonly estado = computed<EstadoVerificacion>(
    () => this.tecnico()?.estadoVerificacion ?? 'PENDIENTE',
  );
  protected readonly mensajeEstado = computed(() => MENSAJES_ESTADO[this.estado()]);
  protected readonly etiquetaEstado = computed(() => ETIQUETAS_ESTADO_VERIFICACION[this.estado()]);
  protected readonly tonoEstado = computed(() => TONOS_ESTADO_VERIFICACION[this.estado()]);
  protected readonly modalidades = computed(() => this.tecnico()?.modalidades ?? []);
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasEstadoUsuario = ETIQUETAS_ESTADO_USUARIO;
  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly iniciales = computed(() => {
    const perfil = this.perfil();
    return perfil === null
      ? ''
      : `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();
  });
  protected readonly esAprobado = computed(() => this.estado() === 'APROBADO');
  protected readonly requiereAtencion = computed(
    () => this.estado() === 'OBSERVADO' || this.estado() === 'RECHAZADO',
  );

  protected readonly editando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);
  protected readonly subiendoFoto = signal(false);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly fotoVersion = signal(0);

  protected readonly cargandoCatalogos = signal(false);
  protected readonly errorCatalogos = signal<string | null>(null);
  protected readonly especialidades = signal<readonly EspecialidadCatalogo[]>([]);
  protected readonly distritos = signal<readonly DistritoCatalogo[]>([]);

  protected readonly formulario = this.fb.group(
    {
      nombres: ['', [Validators.required, Validators.maxLength(80)]],
      apellidos: ['', [Validators.required, Validators.maxLength(80)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
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
      garantiaDiasDefecto: [
        7,
        [Validators.required, Validators.min(0), Validators.max(3650), Validators.pattern(/^\d+$/)],
      ],
      especialidadIds: this.fb.control<readonly number[]>([], [seleccionRequerida]),
      distritoIds: this.fb.control<readonly number[]>([], [seleccionRequerida]),
    },
    { validators: [modalidadRequerida] },
  );

  protected abrirEdicion(): void {
    const perfil = this.perfil();
    const tecnico = this.tecnico();
    if (perfil === null || tecnico === null) {
      return;
    }
    this.formulario.reset({
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      dni: tecnico.dni,
      celular: tecnico.celular,
      descripcion: tecnico.descripcion ?? '',
      aniosExperiencia: tecnico.aniosExperiencia,
      ofreceDomicilio: tecnico.ofreceDomicilio,
      ofreceTaller: tecnico.ofreceTaller,
      direccionTaller: tecnico.direccionTaller ?? '',
      referenciaTaller: tecnico.referenciaTaller ?? '',
      horarioTaller: tecnico.horarioTaller ?? '',
      garantiaDiasDefecto: tecnico.garantiaDiasDefecto,
      especialidadIds: tecnico.especialidades.map((especialidad) => especialidad.id),
      distritoIds: tecnico.distritos.map((distrito) => distrito.id),
    });
    this.cambiarTaller(tecnico.ofreceTaller);
    this.enviado.set(false);
    this.errorGuardado.set(null);
    this.detallesError.set([]);
    this.editando.set(true);
    if (this.especialidades().length === 0 || this.distritos().length === 0) {
      this.cargarCatalogos();
    }
  }

  protected cerrarEdicion(): void {
    this.editando.set(false);
    this.enviado.set(false);
    this.errorGuardado.set(null);
    this.detallesError.set([]);
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
        const api = normalizarError(error);
        this.errorCatalogos.set(
          api.estado === 0
            ? 'No pudimos cargar las especialidades y distritos. Intenta nuevamente.'
            : api.mensaje,
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

  protected guardar(): void {
    this.enviado.set(true);
    this.errorGuardado.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const request: PerfilTecnicoRequest = {
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      dni: valores.dni.trim(),
      celular: valores.celular.trim(),
      descripcion: textoONulo(valores.descripcion),
      aniosExperiencia: Number(valores.aniosExperiencia),
      ofreceDomicilio: valores.ofreceDomicilio,
      ofreceTaller: valores.ofreceTaller,
      direccionTaller: valores.ofreceTaller ? textoONulo(valores.direccionTaller) : null,
      referenciaTaller: valores.ofreceTaller ? textoONulo(valores.referenciaTaller) : null,
      horarioTaller: valores.ofreceTaller ? textoONulo(valores.horarioTaller) : null,
      garantiaDiasDefecto: Number(valores.garantiaDiasDefecto),
      especialidadIds: valores.especialidadIds,
      distritoIds: valores.distritoIds,
    };

    this.guardando.set(true);
    this.perfilService.actualizarPerfil(request).subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(false);
        this.enviado.set(false);
        this.notificaciones.exito('Perfil actualizado. Tu verificación volverá a revisión.');
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.guardando.set(false);
        this.errorGuardado.set(api.mensaje);
        this.detallesError.set(api.detalles);
      },
    });
  }

  protected cambiarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    this.errorFoto.set(null);
    if (archivo === undefined) {
      return;
    }
    if (!TIPOS_FOTO.includes(archivo.type)) {
      this.errorFoto.set('Selecciona una imagen JPG o PNG.');
      return;
    }
    if (archivo.size > MAXIMO_FOTO_BYTES) {
      this.errorFoto.set('La foto no puede superar los 5 MB.');
      return;
    }

    this.subiendoFoto.set(true);
    this.perfilService.actualizarFoto(archivo).subscribe({
      next: () => {
        this.subiendoFoto.set(false);
        this.fotoVersion.update((version) => version + 1);
        this.notificaciones.exito('Foto de perfil actualizada.');
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.subiendoFoto.set(false);
        this.errorFoto.set(api.mensaje);
      },
    });
  }

  protected mostrarError(campo: CampoPerfil): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorSeleccion(campo: CampoSeleccion): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorModalidad(): boolean {
    return this.formulario.hasError('modalidadRequerida') && this.enviado();
  }
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
