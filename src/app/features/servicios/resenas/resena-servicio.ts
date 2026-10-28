import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { Resena, ServicioDetalle } from '../servicio.models';
import {
  ETIQUETAS_CRITERIOS_RESENA,
  ETIQUETAS_ESTADO_RESENA,
  TONOS_ESTADO_RESENA,
  puedeCrearResena,
  puedeReportarResena,
  puedeResponderResena,
} from '../servicio-etiquetas';
import { ServiciosService } from '../servicios.service';

interface CriterioResena {
  readonly etiqueta: string;
  readonly valor: number | null;
}

@Component({
  selector: 'app-resena-servicio',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
  ],
  templateUrl: './resena-servicio.html',
  styleUrl: './resena-servicio.scss',
})
export class ResenaServicio implements OnInit {
  private readonly servicios = inject(ServiciosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly servicio = input.required<ServicioDetalle>();
  readonly esCliente = input.required<boolean>();
  readonly esTecnico = input.required<boolean>();
  readonly actualizado = output<void>();

  protected readonly valores = [1, 2, 3, 4, 5] as const;
  protected readonly etiquetasCriterios = ETIQUETAS_CRITERIOS_RESENA;
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_RESENA;
  protected readonly tonosEstado = TONOS_ESTADO_RESENA;

  protected readonly resena = signal<Resena | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly enviando = signal(false);
  protected readonly respondiendo = signal(false);
  protected readonly reportando = signal(false);
  protected readonly intentoEnvio = signal(false);
  protected readonly estrellas = signal<number | null>(null);

  protected readonly formulario = this.fb.group({
    estrellas: this.fb.control<number | null>(null, [Validators.required]),
    puntualidad: this.fb.control<number | null>(null),
    trato: this.fb.control<number | null>(null),
    calidad: this.fb.control<number | null>(null),
    precioJusto: this.fb.control<number | null>(null),
    comentario: this.fb.control('', [Validators.maxLength(1000)]),
  });

  protected readonly puedeCrear = computed(
    () => this.esCliente() && this.resena() === null && puedeCrearResena(this.servicio().estado),
  );
  protected readonly puedeResponder = computed(() => {
    const resena = this.resena();
    return resena !== null && puedeResponderResena(resena, this.esTecnico());
  });
  protected readonly puedeReportar = computed(() => {
    const resena = this.resena();
    return resena !== null && puedeReportarResena(resena, this.esTecnico());
  });
  protected readonly mostrarVacio = computed(
    () => !this.cargando() && this.error() === null && this.resena() === null,
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicios.obtenerResena(this.servicio().id).subscribe({
      next: (resena) => {
        this.resena.set(resena);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(normalizarError(error));
        this.cargando.set(false);
      },
    });
  }

  protected seleccionarEstrellas(valor: number): void {
    this.formulario.controls.estrellas.setValue(valor);
    this.formulario.controls.estrellas.markAsTouched();
    this.estrellas.set(valor);
  }

  protected esEstrellaActiva(valor: number): boolean {
    const actual = this.estrellas();
    return actual !== null && actual >= valor;
  }

  protected enviarResena(): void {
    if (!this.puedeCrear() || this.enviando()) {
      return;
    }
    this.intentoEnvio.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    if (valores.estrellas === null) {
      return;
    }
    const comentario = valores.comentario.trim();
    this.enviando.set(true);
    this.servicios
      .registrarResena(this.servicio().id, {
        estrellas: valores.estrellas,
        puntualidad: valores.puntualidad,
        trato: valores.trato,
        calidad: valores.calidad,
        precioJusto: valores.precioJusto,
        comentario: comentario === '' ? null : comentario,
      })
      .subscribe({
        next: (resena) => {
          this.enviando.set(false);
          this.resena.set(resena);
          this.notificaciones.exito('Reseña publicada. ¡Gracias por tu opinión!');
          this.actualizado.emit();
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
  }

  protected responder(): void {
    const resena = this.resena();
    if (resena === null || !this.puedeResponder() || this.respondiendo()) {
      return;
    }
    const datos: ConfirmarAccionData = {
      titulo: 'Responder reseña',
      mensaje: 'Tu respuesta será pública junto a la reseña del cliente.',
      detalle: 'Solo puedes responder una vez. Cuida el tono y no incluyas datos personales.',
      icono: 'reply',
      etiquetaConfirmar: 'Publicar respuesta',
      motivo: {
        etiqueta: 'Tu respuesta',
        requerido: true,
        maxLongitud: 1000,
        ayuda: 'Máximo 1000 caracteres.',
      },
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(94vw, 34rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined || resultado.motivo === null) {
        return;
      }
      this.respondiendo.set(true);
      this.servicios.responderResena(this.servicio().id, resena.id, resultado.motivo).subscribe({
        next: (actualizada) => {
          this.respondiendo.set(false);
          this.resena.set(actualizada);
          this.notificaciones.exito('Respuesta publicada.');
        },
        error: (error: unknown) => {
          this.respondiendo.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
    });
  }

  protected reportar(): void {
    const resena = this.resena();
    if (resena === null || !this.puedeReportar() || this.reportando()) {
      return;
    }
    const datos: ConfirmarAccionData = {
      titulo: 'Reportar reseña',
      mensaje: 'La reseña será revisada por administración antes de volver a mostrarse.',
      detalle: 'Explica el motivo del reporte. La reseña quedará oculta mientras se revisa.',
      icono: 'flag',
      etiquetaConfirmar: 'Reportar reseña',
      peligro: true,
      motivo: {
        etiqueta: 'Motivo del reporte',
        requerido: true,
        maxLongitud: 300,
        ayuda: 'Máximo 300 caracteres.',
      },
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(94vw, 34rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined || resultado.motivo === null) {
        return;
      }
      this.reportando.set(true);
      this.servicios.reportarResena(this.servicio().id, resena.id, resultado.motivo).subscribe({
        next: (actualizada) => {
          this.reportando.set(false);
          this.resena.set(actualizada);
          this.notificaciones.exito('Reseña reportada. Administración la revisará.');
        },
        error: (error: unknown) => {
          this.reportando.set(false);
          this.notificaciones.error(normalizarError(error).mensaje);
        },
      });
    });
  }

  protected criterios(resena: Resena): readonly CriterioResena[] {
    return [
      { etiqueta: this.etiquetasCriterios.puntualidad, valor: resena.puntualidad },
      { etiqueta: this.etiquetasCriterios.trato, valor: resena.trato },
      { etiqueta: this.etiquetasCriterios.calidad, valor: resena.calidad },
      { etiqueta: this.etiquetasCriterios.precioJusto, valor: resena.precioJusto },
    ].filter((criterio) => criterio.valor !== null);
  }

  protected ariaEstrellas(resena: Resena): string {
    return `Calificación: ${resena.estrellas} de 5 estrellas`;
  }
}
