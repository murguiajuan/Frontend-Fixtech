import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { Mensaje } from '../servicio.models';
import { ServiciosService } from '../servicios.service';

@Component({
  selector: 'app-mensajes-servicio',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './mensajes-servicio.html',
  styleUrl: './mensajes-servicio.scss',
})
export class MensajesServicio implements OnInit {
  private readonly serviciosService = inject(ServiciosService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly servicioId = input.required<number>();
  readonly contraparteNombre = input.required<string>();

  protected readonly mensajes = signal<readonly Mensaje[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly enviando = signal(false);

  protected readonly formulario = this.fb.group({
    contenido: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.serviciosService.listarMensajes(this.servicioId()).subscribe({
      next: (mensajes) => {
        this.mensajes.set(mensajes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected enviar(): void {
    if (this.enviando() || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const contenido = this.formulario.controls.contenido.value.trim();
    if (contenido === '') {
      this.formulario.controls.contenido.setErrors({ required: true });
      return;
    }
    this.enviando.set(true);
    this.serviciosService.enviarMensaje(this.servicioId(), contenido).subscribe({
      next: (mensaje) => {
        this.enviando.set(false);
        this.mensajes.update((mensajes) => [...mensajes, mensaje]);
        this.formulario.reset({ contenido: '' });
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.notificaciones.error(normalizarError(error).mensaje);
      },
    });
  }

  protected contarCaracteres(): number {
    return this.formulario.controls.contenido.value.length;
  }
}
