import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../../shared/ui/imagen-autenticada';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { Avance, EstadoServicio, TipoAvance } from '../servicio.models';
import { ETIQUETAS_TIPO_AVANCE, tiposAvanceDisponibles } from '../servicio-etiquetas';
import { formatearBytes, validarImagen } from '../servicio-archivos';
import { ServiciosService } from '../servicios.service';

@Component({
  selector: 'app-avances-servicio',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './avances-servicio.html',
  styleUrl: './avances-servicio.scss',
})
export class AvancesServicio {
  private readonly serviciosService = inject(ServiciosService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly servicioId = input.required<number>();
  readonly estado = input.required<EstadoServicio>();
  readonly avances = input.required<readonly Avance[]>();
  readonly esTecnico = input.required<boolean>();
  readonly actualizado = output<void>();

  protected readonly enviando = signal(false);
  protected readonly errorArchivo = signal<string | null>(null);
  protected readonly archivo = signal<File | null>(null);
  protected readonly etiquetasTipo = ETIQUETAS_TIPO_AVANCE;
  protected readonly formatearBytes = formatearBytes;

  protected readonly tiposDisponibles = computed(() => tiposAvanceDisponibles(this.estado()));
  protected readonly puedeRegistrar = computed(
    () => this.esTecnico() && this.tiposDisponibles().length > 0,
  );

  protected readonly formulario = this.fb.group({
    tipo: this.fb.control<TipoAvance | null>(null),
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      const disponibles = this.tiposDisponibles();
      const actual = this.formulario.controls.tipo.value;
      if (actual === null || !disponibles.includes(actual)) {
        this.formulario.controls.tipo.setValue(disponibles[0] ?? null);
      }
    });
  }

  protected urlFoto(avance: Avance): string | null {
    return avance.tieneFoto
      ? this.serviciosService.urlFotoAvance(this.servicioId(), avance.id)
      : null;
  }

  protected seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorArchivo.set(null);
    this.archivo.set(null);
    if (archivo === null) {
      return;
    }
    const error = validarImagen(archivo);
    if (error !== null) {
      this.errorArchivo.set(error);
      input.value = '';
      return;
    }
    this.archivo.set(archivo);
    input.value = '';
  }

  protected quitarArchivo(): void {
    this.archivo.set(null);
    this.errorArchivo.set(null);
  }

  protected registrar(): void {
    if (!this.puedeRegistrar() || this.enviando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    if (valores.tipo === null) {
      this.formulario.controls.tipo.setErrors({ required: true });
      this.formulario.controls.tipo.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.serviciosService
      .registrarAvance(
        this.servicioId(),
        { tipo: valores.tipo, descripcion: valores.descripcion.trim() },
        this.archivo(),
      )
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.notificaciones.exito('Avance registrado. El cliente podrá verlo.');
          this.formulario.reset({ tipo: this.tiposDisponibles()[0] ?? null, descripcion: '' });
          this.archivo.set(null);
          this.errorArchivo.set(null);
          this.actualizado.emit();
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
  }
}
