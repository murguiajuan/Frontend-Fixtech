import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../core/http/api-error';
import { Reclamo } from '../servicio.models';
import { formatearBytes, validarImagen } from '../servicio-archivos';
import { ServiciosService } from '../servicios.service';

export interface ReclamoDialogData {
  readonly servicioId: number;
}

const MAX_FOTOS = 5;

@Component({
  selector: 'app-reclamo-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reclamo-dialog.html',
  styleUrl: './reclamo-dialog.scss',
})
export class ReclamoDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicios = inject(ServiciosService);
  private readonly referencia =
    inject<MatDialogRef<ReclamoDialog, Reclamo | undefined>>(MatDialogRef);
  private readonly datos = inject<ReclamoDialogData>(MAT_DIALOG_DATA);

  protected readonly maxFotos = MAX_FOTOS;
  protected readonly formatearBytes = formatearBytes;

  protected readonly formulario = this.fb.group({
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  protected readonly fotos = signal<readonly File[]>([]);
  protected readonly errorArchivo = signal<string | null>(null);
  protected readonly enviado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  protected seleccionarFotos(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const seleccionadas = Array.from(input.files ?? []);
    input.value = '';
    this.errorArchivo.set(null);

    const errores: string[] = [];
    const nuevas: File[] = [];
    for (const archivo of seleccionadas) {
      const error = validarImagen(archivo);
      if (error !== null) {
        errores.push(error);
        continue;
      }
      const duplicada = this.fotos().some(
        (actual) =>
          actual.name === archivo.name &&
          actual.size === archivo.size &&
          actual.lastModified === archivo.lastModified,
      );
      if (!duplicada) {
        nuevas.push(archivo);
      }
    }

    const total = this.fotos().length + nuevas.length;
    if (total > MAX_FOTOS) {
      errores.push(`Puedes adjuntar hasta ${MAX_FOTOS} fotos.`);
    } else {
      this.fotos.update((actuales) => [...actuales, ...nuevas]);
    }
    if (errores.length > 0) {
      this.errorArchivo.set(errores.join(' '));
    }
  }

  protected quitarFoto(indice: number): void {
    this.fotos.update((actuales) => actuales.filter((_, posicion) => posicion !== indice));
    this.errorArchivo.set(null);
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.fotos().length === 0) {
      this.errorArchivo.set('Adjunta entre 1 y 5 fotos como evidencia del reclamo.');
      return;
    }

    const descripcion = this.formulario.controls.descripcion.value.trim();
    this.enviando.set(true);
    this.servicios.crearReclamo(this.datos.servicioId, descripcion, this.fotos()).subscribe({
      next: (reclamo) => {
        this.enviando.set(false);
        this.referencia.close(reclamo);
      },
      error: (error: unknown) => {
        const apiError = normalizarError(error);
        this.enviando.set(false);
        this.errorServidor.set(apiError.mensaje);
        this.detallesError.set(apiError.detalles);
      },
    });
  }

  protected cancelar(): void {
    this.referencia.close();
  }
}
