import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { normalizarError } from '../../../core/http/api-error';
import { validarRangoFechasOpcional } from '../../../core/models/fechas';
import { AdminAuditoriaService } from '../services/admin-auditoria.service';
import {
  FiltrosAuditoria,
  PaginaAuditoria,
  TAMANOS_PAGINA_AUDITORIA,
  TamanoPaginaAuditoria,
} from './auditoria.models';

const FILTROS_INICIALES: FiltrosAuditoria = {
  usuarioId: null,
  entidad: '',
  accion: '',
  desde: '',
  hasta: '',
  pagina: 0,
  tamano: 20,
};

@Component({
  selector: 'app-admin-auditoria-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './auditoria.page.html',
  styleUrl: './auditoria.page.scss',
})
export class AdminAuditoriaPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminAuditoria = inject(AdminAuditoriaService);

  protected readonly tamanosPagina = TAMANOS_PAGINA_AUDITORIA;
  protected readonly enviado = signal(false);
  protected readonly errorFechas = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    usuarioId: this.fb.control('', [Validators.pattern(/^\s*[1-9]\d*\s*$/)]),
    entidad: this.fb.control('', [Validators.maxLength(60)]),
    accion: this.fb.control('', [Validators.maxLength(60)]),
    desde: this.fb.control(''),
    hasta: this.fb.control(''),
    tamano: this.fb.control<TamanoPaginaAuditoria>(20),
  });

  private readonly filtrosAplicados = signal<FiltrosAuditoria>(FILTROS_INICIALES);

  protected readonly auditoriaResource = rxResource<PaginaAuditoria, FiltrosAuditoria>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminAuditoria.listar(params),
  });

  protected readonly error = computed(() => {
    const fallo = this.auditoriaResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly pagina = computed<PaginaAuditoria | null>(() =>
    this.auditoriaResource.hasValue() ? this.auditoriaResource.value() : null,
  );

  protected readonly hayFiltros = computed(() => {
    const filtros = this.filtrosAplicados();
    return (
      filtros.usuarioId !== null ||
      filtros.entidad !== '' ||
      filtros.accion !== '' ||
      filtros.desde !== '' ||
      filtros.hasta !== ''
    );
  });

  protected readonly puedeAnterior = computed(() => {
    const pagina = this.pagina();
    return pagina !== null && pagina.pagina > 0 && !this.auditoriaResource.isLoading();
  });

  protected readonly puedeSiguiente = computed(() => {
    const pagina = this.pagina();
    return (
      pagina !== null &&
      pagina.pagina + 1 < pagina.totalPaginas &&
      !this.auditoriaResource.isLoading()
    );
  });

  protected usuarioIdInvalido(): boolean {
    const control = this.formulario.controls.usuarioId;
    return (control.touched || this.enviado()) && control.hasError('pattern');
  }

  protected aplicarFiltros(): void {
    this.enviado.set(true);
    this.errorFechas.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const mensaje = validarRangoFechasOpcional(valores.desde, valores.hasta);
    if (mensaje !== null) {
      this.errorFechas.set(mensaje);
      return;
    }

    const usuarioId = valores.usuarioId.trim();
    this.filtrosAplicados.set({
      usuarioId: usuarioId === '' ? null : Number(usuarioId),
      entidad: valores.entidad.trim(),
      accion: valores.accion.trim(),
      desde: valores.desde,
      hasta: valores.hasta,
      pagina: 0,
      tamano: valores.tamano,
    });
  }

  protected limpiarFiltros(): void {
    this.formulario.reset({
      usuarioId: '',
      entidad: '',
      accion: '',
      desde: '',
      hasta: '',
      tamano: 20,
    });
    this.enviado.set(false);
    this.errorFechas.set(null);
    this.filtrosAplicados.set(FILTROS_INICIALES);
  }

  protected cambiarPagina(delta: number): void {
    const actual = this.filtrosAplicados();
    const pagina = this.pagina();
    if (pagina === null) {
      return;
    }
    const destino = actual.pagina + delta;
    if (destino < 0 || destino >= pagina.totalPaginas) {
      return;
    }
    this.filtrosAplicados.set({ ...actual, pagina: destino });
  }

  protected recargar(): void {
    this.auditoriaResource.reload();
  }
}
