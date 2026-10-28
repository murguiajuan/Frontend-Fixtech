import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../core/http/api-error';
import { Constancia, TipoConstancia } from '../servicio.models';
import { ETIQUETAS_TIPO_CONSTANCIA } from '../servicio-etiquetas';
import { formatearBytes, validarImagen } from '../servicio-archivos';
import { ServiciosService } from '../servicios.service';

export interface ConstanciaDialogData {
  readonly servicioId: number;
  readonly tipo: TipoConstancia;
}

const MAX_FOTOS = 5;

@Component({
  selector: 'app-constancia-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './constancia-dialog.html',
  styleUrl: './constancia-dialog.scss',
})
export class ConstanciaDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicios = inject(ServiciosService);
  private readonly referencia =
    inject<MatDialogRef<ConstanciaDialog, Constancia | undefined>>(MatDialogRef);
  private readonly datos = inject<ConstanciaDialogData>(MAT_DIALOG_DATA);

  protected readonly tipo = this.datos.tipo;
  protected readonly etiquetaTipo = ETIQUETAS_TIPO_CONSTANCIA[this.datos.tipo];
  protected readonly maxFotos = MAX_FOTOS;
  protected readonly formatearBytes = formatearBytes;

  protected readonly formulario = this.fb.group({
    observaciones: ['', [Validators.maxLength(1000)]],
    accesorios: ['', [Validators.maxLength(300)]],
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
      this.errorArchivo.set('Adjunta entre 1 y 5 fotos de la constancia.');
      return;
    }

    const valores = this.formulario.getRawValue();
    this.enviando.set(true);
    this.servicios
      .registrarConstancia(
        this.datos.servicioId,
        {
          tipo: this.tipo,
          observaciones: valores.observaciones.trim() === '' ? null : valores.observaciones.trim(),
          accesorios: valores.accesorios.trim() === '' ? null : valores.accesorios.trim(),
        },
        this.fotos(),
      )
      .subscribe({
        next: (constancia) => {
          this.enviando.set(false);
          this.referencia.close(constancia);
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
