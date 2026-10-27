import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Modalidad } from '../../../../core/auth/auth.models';
import { CatalogoService } from '../../../../core/catalogos/catalogo.service';
import { CatalogoSimple, DistritoCatalogo } from '../../../../core/catalogos/catalogo.models';
import { normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { ImagenAutenticada } from '../../../../shared/ui/imagen-autenticada';
import { SolicitudesService } from '../../services/solicitudes.service';
import { ETIQUETAS_URGENCIA, URGENCIAS, esEditable } from '../solicitud-etiquetas';
import { SolicitudDetalle, SolicitudRequest, Urgencia } from '../solicitud.models';

interface FotoSeleccionada {
  readonly archivo: File;
  readonly url: string;
  readonly nombre: string;
}

type CampoSolicitud =
  | 'tipoEquipoId'
  | 'tipoServicioId'
  | 'marca'
  | 'modelo'
  | 'descripcion'
  | 'urgencia'
  | 'modalidad'
  | 'distritoId'
  | 'direccion'
  | 'referencia'
  | 'fechaPreferida'
  | 'horarioPreferido'
  | 'presupuestoReferencial';

const MAX_FOTOS = 5;
const MAX_FOTO_BYTES = 5 * 1024 * 1024;
const TIPOS_FOTO = ['image/jpeg', 'image/png'];

@Component({
  selector: 'app-solicitud-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ImagenAutenticada,
  ],
  templateUrl: './solicitud-form.page.html',
  styleUrl: './solicitud-form.page.scss',
})
export class SolicitudFormPage implements OnInit {
  private readonly solicitudes = inject(SolicitudesService);
  private readonly catalogos = inject(CatalogoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string | undefined>(undefined);

  protected readonly esEdicion = computed(() => this.id() !== undefined);
  protected readonly solicitud = signal<SolicitudDetalle | null>(null);
  protected readonly cargandoSolicitud = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly cargandoCatalogos = signal(true);
  protected readonly errorCatalogos = signal<string | null>(null);

  protected readonly tiposEquipo = signal<readonly CatalogoSimple[]>([]);
  protected readonly tiposServicio = signal<readonly CatalogoSimple[]>([]);
  protected readonly distritos = signal<readonly DistritoCatalogo[]>([]);
  protected readonly fotos = signal<readonly FotoSeleccionada[]>([]);
  protected readonly errorFotos = signal<string | null>(null);

  protected readonly guardando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly urgencias = URGENCIAS;
  protected readonly maxFotos = MAX_FOTOS;
  protected readonly fechaMinima = fechaLocalIso(new Date());

  protected readonly titulo = computed(() =>
    this.esEdicion() ? 'Editar solicitud' : 'Nueva solicitud',
  );
  protected readonly puedeEditar = computed(() => {
    const solicitud = this.solicitud();
    return !this.esEdicion() || solicitud === null || esEditable(solicitud.estado);
  });

  protected readonly formulario = this.fb.group({
    tipoEquipoId: this.fb.control<number | null>(null, [Validators.required]),
    tipoServicioId: this.fb.control<number | null>(null, [Validators.required]),
    marca: ['', [Validators.maxLength(60)]],
    modelo: ['', [Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
    urgencia: ['MEDIA' as Urgencia, [Validators.required]],
    modalidad: ['DOMICILIO' as Modalidad, [Validators.required]],
    distritoId: this.fb.control<number | null>(null, [Validators.required]),
    direccion: ['', [Validators.maxLength(200), direccionRequerida]],
    referencia: ['', [Validators.maxLength(200)]],
    fechaPreferida: ['', [fechaNoPasada]],
    horarioPreferido: ['', [Validators.maxLength(40)]],
    presupuestoReferencial: this.fb.control<number | null>(null, [
      Validators.min(0.01),
      Validators.max(99999999.99),
    ]),
  });

  constructor() {
    this.formulario.controls.modalidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formulario.controls.direccion.updateValueAndValidity());

    this.destroyRef.onDestroy(() => {
      this.fotos().forEach((foto) => URL.revokeObjectURL(foto.url));
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    const id = this.id();
    if (id !== undefined) {
      this.cargarSolicitud(Number(id));
    }
  }

  protected cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set(null);
    forkJoin({
      equipos: this.catalogos.listarTiposEquipo(),
      servicios: this.catalogos.listarTiposServicio(),
      distritos: this.catalogos.listarDistritos(),
    }).subscribe({
      next: ({ equipos, servicios, distritos }) => {
        this.tiposEquipo.set(equipos.filter((tipo) => tipo.activo));
        this.tiposServicio.set(servicios.filter((tipo) => tipo.activo));
        this.distritos.set(distritos.filter((distrito) => distrito.activo));
        this.cargandoCatalogos.set(false);
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.errorCatalogos.set(api.mensaje);
        this.cargandoCatalogos.set(false);
      },
    });
  }

  protected reintentarCarga(): void {
    const id = this.id();
    if (id !== undefined) {
      this.cargarSolicitud(Number(id));
    }
  }

  protected cargarSolicitud(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      this.errorCarga.set('La solicitud indicada no es válida.');
      return;
    }
    this.cargandoSolicitud.set(true);
    this.errorCarga.set(null);
    this.solicitudes.obtener(id).subscribe({
      next: (solicitud) => {
        this.solicitud.set(solicitud);
        this.formulario.patchValue({
          tipoEquipoId: solicitud.tipoEquipoId,
          tipoServicioId: solicitud.tipoServicioId,
          marca: solicitud.marca ?? '',
          modelo: solicitud.modelo ?? '',
          descripcion: solicitud.descripcion,
          urgencia: solicitud.urgencia,
          modalidad: solicitud.modalidad,
          distritoId: solicitud.distritoId,
          direccion: solicitud.direccion ?? '',
          referencia: solicitud.referencia ?? '',
          fechaPreferida: solicitud.fechaPreferida ?? '',
          horarioPreferido: solicitud.horarioPreferido ?? '',
          presupuestoReferencial: solicitud.presupuestoReferencial,
        });
        this.cargandoSolicitud.set(false);
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.errorCarga.set(api.mensaje);
        this.cargandoSolicitud.set(false);
      },
    });
  }

  protected seleccionarFotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    input.value = '';
    this.errorFotos.set(null);
    if (archivos.length === 0) {
      return;
    }

    const seleccionadas = [...this.fotos()];
    const errores: string[] = [];
    for (const archivo of archivos) {
      if (seleccionadas.length >= MAX_FOTOS) {
        errores.push(`Puedes adjuntar como máximo ${MAX_FOTOS} fotos.`);
        break;
      }
      if (!TIPOS_FOTO.includes(archivo.type)) {
        errores.push(`${archivo.name}: solo se permiten imágenes JPG o PNG.`);
        continue;
      }
      if (archivo.size > MAX_FOTO_BYTES) {
        errores.push(`${archivo.name}: la imagen supera los 5 MB.`);
        continue;
      }
      seleccionadas.push({
        archivo,
        url: URL.createObjectURL(archivo),
        nombre: archivo.name,
      });
    }

    this.fotos.set(seleccionadas);
    if (errores.length > 0) {
      this.errorFotos.set(errores.join(' '));
    }
  }

  protected quitarFoto(indice: number): void {
    const foto = this.fotos()[indice];
    if (foto === undefined) {
      return;
    }
    URL.revokeObjectURL(foto.url);
    this.fotos.update((fotos) => fotos.filter((_actual, posicion) => posicion !== indice));
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorGuardado.set(null);
    this.detallesError.set([]);
    this.errorFotos.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (!this.esEdicion() && this.fotos().length === 0) {
      this.errorFotos.set('Adjunta al menos una foto del equipo.');
      return;
    }
    if (!this.puedeEditar()) {
      return;
    }

    const valores = this.formulario.getRawValue();
    if (
      valores.tipoEquipoId === null ||
      valores.tipoServicioId === null ||
      valores.distritoId === null
    ) {
      return;
    }

    const datos: SolicitudRequest = {
      tipoEquipoId: valores.tipoEquipoId,
      tipoServicioId: valores.tipoServicioId,
      marca: textoONulo(valores.marca),
      modelo: textoONulo(valores.modelo),
      descripcion: valores.descripcion.trim(),
      urgencia: valores.urgencia,
      modalidad: valores.modalidad,
      distritoId: valores.distritoId,
      direccion: textoONulo(valores.direccion),
      referencia: textoONulo(valores.referencia),
      fechaPreferida: valores.fechaPreferida === '' ? null : valores.fechaPreferida,
      horarioPreferido: textoONulo(valores.horarioPreferido),
      presupuestoReferencial:
        valores.presupuestoReferencial === null ? null : Number(valores.presupuestoReferencial),
    };

    this.guardando.set(true);
    const peticion = this.esEdicion()
      ? this.solicitudes.actualizar(Number(this.id()), datos)
      : this.solicitudes.crear(
          datos,
          this.fotos().map((foto) => foto.archivo),
        );

    peticion.subscribe({
      next: (solicitud) => {
        this.guardando.set(false);
        this.notificaciones.exito(
          this.esEdicion() ? 'Solicitud actualizada.' : 'Solicitud publicada.',
        );
        void this.router.navigate(['/app/cliente/solicitudes', solicitud.id]);
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.guardando.set(false);
        this.errorGuardado.set(api.mensaje);
        this.detallesError.set(api.detalles);
      },
    });
  }

  protected mostrarError(campo: CampoSolicitud): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorDireccion(): boolean {
    return this.formulario.controls.direccion.hasError('direccionRequerida');
  }
}

function fechaNoPasada(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (typeof valor !== 'string' || valor === '') {
    return null;
  }
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return { fechaInvalida: true };
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha < hoy ? { fechaPasada: true } : null;
}

function direccionRequerida(control: AbstractControl): ValidationErrors | null {
  const modalidad = control.parent?.get('modalidad')?.value as Modalidad | undefined;
  if (modalidad === undefined || modalidad === 'TALLER') {
    return null;
  }
  return typeof control.value === 'string' && control.value.trim() !== ''
    ? null
    : { direccionRequerida: true };
}

function textoONulo(valor: string): string | null {
  const texto = valor.trim();
  return texto === '' ? null : texto;
}

function fechaLocalIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}
