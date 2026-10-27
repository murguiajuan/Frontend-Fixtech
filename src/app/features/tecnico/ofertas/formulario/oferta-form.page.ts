import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, startWith, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/catalogos/catalogo.service';
import { DistritoCatalogo } from '../../../../core/catalogos/catalogo.models';
import { ApiError, normalizarError } from '../../../../core/http/api-error';
import { ETIQUETAS_MODALIDAD } from '../../../../core/models/etiquetas';
import { EstadoBadge } from '../../../../shared/ui/estado-badge';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import {
  ETIQUETAS_ESTADO_OFERTA,
  TONOS_ESTADO_OFERTA,
  estaActiva,
} from '../../../ofertas/oferta-etiquetas';
import {
  ETIQUETAS_URGENCIA,
  TONOS_URGENCIA,
} from '../../../cliente/solicitudes/solicitud-etiquetas';
import {
  ModalidadOferta,
  Oferta,
  OfertaRequest,
  SolicitudDisponible,
} from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';

type CampoOferta =
  | 'modalidad'
  | 'precioServicio'
  | 'costoMovilidad'
  | 'costoDiagnostico'
  | 'tiempoEstimadoHoras'
  | 'garantiaDias'
  | 'mensaje';

@Component({
  selector: 'app-oferta-form-page',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
  ],
  templateUrl: './oferta-form.page.html',
  styleUrl: './oferta-form.page.scss',
})
export class OfertaFormPage implements OnInit {
  private readonly ofertas = inject(OfertasService);
  private readonly solicitudesDisponibles = inject(SolicitudesDisponiblesService);
  private readonly catalogos = inject(CatalogoService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly solicitudId = input<string | undefined>(undefined);
  readonly ofertaId = input<string | undefined>(undefined);

  protected readonly esEdicion = computed(() => this.ofertaId() !== undefined);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<ApiError | null>(null);
  protected readonly solicitud = signal<SolicitudDisponible | null>(null);
  protected readonly ofertaExistente = signal<Oferta | null>(null);
  protected readonly bloqueada = signal(false);
  protected readonly guardando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);
  protected readonly distritos = signal<readonly DistritoCatalogo[]>([]);
  protected readonly topeMovilidad = signal<number | null>(null);

  protected readonly tecnico = computed(() => this.auth.perfil()?.tecnico ?? null);
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasEstadoOferta = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstadoOferta = TONOS_ESTADO_OFERTA;
  protected readonly etiquetasUrgencia = ETIQUETAS_URGENCIA;
  protected readonly tonosUrgencia = TONOS_URGENCIA;

  protected readonly modalidadesDisponibles = computed<readonly ModalidadOferta[]>(() => {
    const solicitud = this.solicitud();
    const tecnico = this.tecnico();
    if (solicitud === null || tecnico === null) {
      return [];
    }
    const ofreceDomicilio = tecnico.ofreceDomicilio;
    const ofreceTaller = tecnico.ofreceTaller;
    switch (solicitud.modalidad) {
      case 'DOMICILIO':
        return ofreceDomicilio ? ['DOMICILIO'] : [];
      case 'TALLER':
        return ofreceTaller ? ['TALLER'] : [];
      case 'INDISTINTO': {
        const modalidades: ModalidadOferta[] = [];
        if (ofreceDomicilio) {
          modalidades.push('DOMICILIO');
        }
        if (ofreceTaller) {
          modalidades.push('TALLER');
        }
        return modalidades;
      }
    }
  });

  protected readonly distritoNombre = computed(() => this.solicitud()?.distrito ?? '');
  protected readonly titulo = computed(() =>
    this.esEdicion() ? 'Editar oferta' : 'Enviar oferta',
  );

  protected readonly formulario = this.fb.group({
    modalidad: ['DOMICILIO' as ModalidadOferta, [Validators.required]],
    precioServicio: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(99_999_999.99),
    ]),
    costoMovilidad: this.fb.control<number>(0, [Validators.min(0), Validators.max(99_999_999.99)]),
    costoDiagnostico: this.fb.control<number>(0, [
      Validators.min(0),
      Validators.max(99_999_999.99),
    ]),
    tiempoEstimadoHoras: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(999),
    ]),
    garantiaDias: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(3650)]),
    mensaje: ['', [Validators.maxLength(500)]],
  });

  private readonly valoresFormulario = toSignal(
    this.formulario.valueChanges.pipe(startWith(this.formulario.getRawValue())),
    { initialValue: this.formulario.getRawValue() },
  );

  protected readonly esTaller = computed(() => this.valoresFormulario().modalidad === 'TALLER');

  protected readonly totalEstimado = computed(() => {
    const valores = this.valoresFormulario();
    const precio = typeof valores.precioServicio === 'number' ? valores.precioServicio : 0;
    const movilidad = typeof valores.costoMovilidad === 'number' ? valores.costoMovilidad : 0;
    return precio + movilidad;
  });

  constructor() {
    this.formulario.controls.modalidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((modalidad) => this.aplicarModalidad(modalidad));
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.bloqueada.set(false);
    this.ofertaExistente.set(null);

    if (this.esEdicion()) {
      const ofertaId = Number(this.ofertaId());
      if (!Number.isInteger(ofertaId) || ofertaId <= 0) {
        this.errorCarga.set({
          estado: 0,
          mensaje: 'La oferta indicada no es válida.',
          detalles: [],
        });
        this.cargando.set(false);
        return;
      }
      this.cargarEdicion(ofertaId);
      return;
    }

    const solicitudId = Number(this.solicitudId());
    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
      this.errorCarga.set({
        estado: 0,
        mensaje: 'La solicitud indicada no es válida.',
        detalles: [],
      });
      this.cargando.set(false);
      return;
    }
    this.cargarCreacion(solicitudId);
  }

  protected reintentarCarga(): void {
    this.cargar();
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorGuardado.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid || this.bloqueada()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    if (valores.precioServicio === null || valores.tiempoEstimadoHoras === null) {
      return;
    }

    const datos: OfertaRequest = {
      modalidad: valores.modalidad,
      precioServicio: Number(valores.precioServicio),
      costoMovilidad: valores.modalidad === 'TALLER' ? 0 : Number(valores.costoMovilidad),
      costoDiagnostico: Number(valores.costoDiagnostico),
      tiempoEstimadoHoras: Number(valores.tiempoEstimadoHoras),
      garantiaDias: valores.garantiaDias === null ? null : Number(valores.garantiaDias),
      mensaje: textoONulo(valores.mensaje),
    };

    this.guardando.set(true);
    const peticion = this.esEdicion()
      ? this.ofertas.actualizar(Number(this.ofertaId()), datos)
      : this.ofertas.crear(Number(this.solicitudId()), datos);

    peticion.subscribe({
      next: (oferta) => {
        this.guardando.set(false);
        if (this.esEdicion()) {
          this.notificaciones.exito('Oferta actualizada.');
          void this.router.navigate(['/app/tecnico/ofertas']);
        } else {
          this.notificaciones.exito('Oferta enviada.');
          void this.router.navigate(['/app/tecnico/solicitudes', oferta.solicitudId]);
        }
      },
      error: (error: unknown) => {
        const api = normalizarError(error);
        this.guardando.set(false);
        this.errorGuardado.set(api.mensaje);
        this.detallesError.set(api.detalles);
      },
    });
  }

  protected mostrarError(campo: CampoOferta): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorMovilidad(): boolean {
    const control = this.formulario.controls.costoMovilidad;
    return control.invalid && (control.touched || this.enviado());
  }

  private cargarCreacion(solicitudId: number): void {
    forkJoin({
      solicitud: this.solicitudesDisponibles.obtener(solicitudId),
      ofertas: this.ofertas.listarMias(),
      distritos: this.catalogos.listarDistritos(),
    }).subscribe({
      next: ({ solicitud, ofertas, distritos }) => {
        this.prepararSolicitud(solicitud, distritos);
        const existente = ofertas.find((oferta) => oferta.solicitudId === solicitudId) ?? null;
        this.ofertaExistente.set(existente);
        if (existente !== null) {
          if (estaActiva(existente.estado) || existente.estado === 'ACEPTADA') {
            this.bloqueada.set(true);
          } else {
            this.prefill(existente);
          }
        }
        this.aplicarModalidad(this.formulario.controls.modalidad.value);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.errorCarga.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  private cargarEdicion(ofertaId: number): void {
    this.ofertas
      .listarMias()
      .pipe(
        map((ofertas) => ofertas.find((oferta) => oferta.id === ofertaId) ?? null),
        switchMap((oferta) => {
          if (oferta === null) {
            return throwError(
              () =>
                ({
                  estado: 404,
                  mensaje: 'No encontramos la oferta solicitada.',
                  detalles: [],
                }) satisfies ApiError,
            );
          }
          return forkJoin({
            oferta: of(oferta),
            solicitud: this.solicitudesDisponibles.obtener(oferta.solicitudId),
            distritos: this.catalogos.listarDistritos(),
          });
        }),
      )
      .subscribe({
        next: ({ oferta, solicitud, distritos }) => {
          this.prepararSolicitud(solicitud, distritos);
          this.ofertaExistente.set(oferta);
          if (!estaActiva(oferta.estado)) {
            this.bloqueada.set(true);
            this.cargando.set(false);
            return;
          }
          this.prefill(oferta);
          this.aplicarModalidad(this.formulario.controls.modalidad.value);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.errorCarga.set(normalizarError(error));
          this.cargando.set(false);
        },
      });
  }

  private prepararSolicitud(
    solicitud: SolicitudDisponible,
    distritos: readonly DistritoCatalogo[],
  ): void {
    this.solicitud.set(solicitud);
    this.distritos.set(distritos);
    const distrito = distritos.find((item) => item.id === solicitud.distritoId);
    this.topeMovilidad.set(distrito?.topeMovilidad ?? null);
    const modalidad = this.modalidadesDisponibles()[0] ?? 'DOMICILIO';
    this.formulario.patchValue({
      modalidad,
      garantiaDias: this.tecnico()?.garantiaDiasDefecto ?? null,
    });
  }

  private prefill(oferta: Oferta): void {
    this.formulario.patchValue({
      modalidad: oferta.modalidad,
      precioServicio: oferta.precioServicio,
      costoMovilidad: oferta.costoMovilidad,
      costoDiagnostico: oferta.costoDiagnostico,
      tiempoEstimadoHoras: oferta.tiempoEstimadoHoras,
      garantiaDias: oferta.garantiaDias,
      mensaje: oferta.mensaje ?? '',
    });
  }

  private aplicarModalidad(modalidad: ModalidadOferta): void {
    const movilidad = this.formulario.controls.costoMovilidad;
    if (modalidad === 'TALLER') {
      movilidad.disable({ emitEvent: false });
      movilidad.setValue(0, { emitEvent: false });
      this.formulario.updateValueAndValidity({ emitEvent: true });
      return;
    }

    movilidad.enable({ emitEvent: false });
    const tope = this.topeMovilidad();
    movilidad.setValidators([
      Validators.min(0),
      tope === null ? Validators.max(99_999_999.99) : Validators.max(tope),
    ]);
    movilidad.updateValueAndValidity({ emitEvent: true });
  }
}

function textoONulo(valor: string): string | null {
  const texto = valor.trim();
  return texto === '' ? null : texto;
}
