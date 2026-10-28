import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { normalizarError } from '../../../core/http/api-error';
import {
  CatalogoAdmin,
  CatalogoAdminRequest,
  MAX_DESCRIPCION_ESPECIALIDAD,
  MAX_PROVINCIA_DISTRITO,
  OPCIONES_CATALOGO_ADMIN,
  TOPE_MOVILIDAD_MAXIMO,
  TipoCatalogoAdmin,
  esDistritoAdmin,
  esEspecialidadAdmin,
} from './catalogos-admin.models';
import { AdminCatalogosService } from '../services/admin-catalogos.service';

export interface CatalogoFormDialogData {
  readonly tipo: TipoCatalogoAdmin;
  readonly item: CatalogoAdmin | null;
}

@Component({
  selector: 'app-catalogo-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './catalogo-form-dialog.html',
  styleUrl: './catalogo-form-dialog.scss',
})
export class CatalogoFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminCatalogos = inject(AdminCatalogosService);
  private readonly referencia =
    inject<MatDialogRef<CatalogoFormDialog, CatalogoAdmin>>(MatDialogRef);
  private readonly datos = inject<CatalogoFormDialogData>(MAT_DIALOG_DATA);

  protected readonly tipo = this.datos.tipo;
  protected readonly item = this.datos.item;
  protected readonly opcion = OPCIONES_CATALOGO_ADMIN[this.tipo];
  protected readonly esEspecialidad = this.tipo === 'especialidades';
  protected readonly esDistrito = this.tipo === 'distritos';
  protected readonly titulo =
    this.item === null ? this.opcion.tituloCrear : this.opcion.tituloEditar;
  protected readonly etiquetaAccion = this.item === null ? 'Crear' : 'Guardar cambios';
  protected readonly maxDescripcion = MAX_DESCRIPCION_ESPECIALIDAD;
  protected readonly maxProvincia = MAX_PROVINCIA_DISTRITO;
  protected readonly maxTope = TOPE_MOVILIDAD_MAXIMO;

  protected readonly formulario = this.fb.group({
    nombre: this.fb.control('', [Validators.required, Validators.maxLength(this.opcion.maxNombre)]),
    descripcion: this.fb.control(
      '',
      this.esEspecialidad ? [Validators.maxLength(MAX_DESCRIPCION_ESPECIALIDAD)] : [],
    ),
    provincia: this.fb.control(
      '',
      this.esDistrito ? [Validators.required, Validators.maxLength(MAX_PROVINCIA_DISTRITO)] : [],
    ),
    topeMovilidad: this.fb.control<number | null>(
      null,
      this.esDistrito
        ? [Validators.required, Validators.min(0), Validators.max(TOPE_MOVILIDAD_MAXIMO)]
        : [],
    ),
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);

  constructor() {
    const item = this.datos.item;
    if (item !== null) {
      this.formulario.patchValue({
        nombre: item.nombre,
        descripcion: esEspecialidadAdmin(item) ? (item.descripcion ?? '') : '',
        provincia: esDistritoAdmin(item) ? item.provincia : '',
        topeMovilidad: esDistritoAdmin(item) ? item.topeMovilidad : null,
      });
    }
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const solicitud = this.construirSolicitud();
    if (solicitud === null) {
      return;
    }

    const operacion: Observable<CatalogoAdmin> =
      this.item === null
        ? this.adminCatalogos.crear(this.tipo, solicitud)
        : this.adminCatalogos.actualizar(this.tipo, this.item.id, solicitud);

    this.enviando.set(true);
    operacion.subscribe({
      next: (catalogo) => {
        this.enviando.set(false);
        this.referencia.close(catalogo);
      },
      error: (error: unknown) => {
        const apiError = normalizarError(error);
        this.errorServidor.set(apiError.mensaje);
        this.detallesError.set(apiError.detalles);
        this.enviando.set(false);
      },
    });
  }

  protected cancelar(): void {
    this.referencia.close();
  }

  private construirSolicitud(): CatalogoAdminRequest | null {
    const valores = this.formulario.getRawValue();
    const nombre = valores.nombre.trim();
    if (this.esDistrito) {
      if (valores.topeMovilidad === null) {
        return null;
      }
      return {
        nombre,
        provincia: valores.provincia.trim(),
        topeMovilidad: valores.topeMovilidad,
      };
    }
    if (this.esEspecialidad) {
      const descripcion = valores.descripcion.trim();
      return { nombre, descripcion: descripcion === '' ? null : descripcion };
    }
    return { nombre };
  }
}
