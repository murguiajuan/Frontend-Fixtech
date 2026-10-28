import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AdminCatalogosService } from '../services/admin-catalogos.service';
import {
  CatalogoAdmin,
  OPCIONES_CATALOGO_ADMIN,
  TIPOS_CATALOGO_ADMIN,
  TipoCatalogoAdmin,
  esDistritoAdmin,
  esEspecialidadAdmin,
} from './catalogos-admin.models';
import { CatalogoFormDialog, CatalogoFormDialogData } from './catalogo-form-dialog';

interface ParametrosCatalogo {
  readonly tipo: TipoCatalogoAdmin;
  readonly incluirInactivos: boolean;
}

interface CatalogoItemVista {
  readonly item: CatalogoAdmin;
  readonly detalle: string | null;
}

const FORMATO_MONEDA = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'app-admin-catalogos-page',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
  ],
  templateUrl: './catalogos.page.html',
  styleUrl: './catalogos.page.scss',
})
export class AdminCatalogosPage {
  private readonly adminCatalogos = inject(AdminCatalogosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly opciones = TIPOS_CATALOGO_ADMIN.map((tipo) => OPCIONES_CATALOGO_ADMIN[tipo]);
  protected readonly tipoSeleccionado = signal<TipoCatalogoAdmin>('tipos-equipo');
  protected readonly incluirInactivos = signal(true);
  protected readonly procesandoId = signal<number | null>(null);

  protected readonly opcion = computed(() => OPCIONES_CATALOGO_ADMIN[this.tipoSeleccionado()]);

  protected readonly catalogoResource = rxResource<readonly CatalogoAdmin[], ParametrosCatalogo>({
    params: () => ({
      tipo: this.tipoSeleccionado(),
      incluirInactivos: this.incluirInactivos(),
    }),
    stream: ({ params }) => this.adminCatalogos.listar(params.tipo, params.incluirInactivos),
  });

  protected readonly error = computed(() => {
    const fallo = this.catalogoResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly itemsVista = computed<readonly CatalogoItemVista[]>(() => {
    const catalogo = this.catalogoResource.hasValue() ? this.catalogoResource.value() : [];
    return catalogo.map((item) => ({ item, detalle: this.detalleItem(item) }));
  });

  protected cambiarTipo(tipo: TipoCatalogoAdmin): void {
    if (tipo === this.tipoSeleccionado()) {
      return;
    }
    this.procesandoId.set(null);
    this.tipoSeleccionado.set(tipo);
  }

  protected cambiarIncluirInactivos(evento: MatCheckboxChange): void {
    this.incluirInactivos.set(evento.checked);
  }

  protected mostrarInactivos(): void {
    this.incluirInactivos.set(true);
  }

  protected recargar(): void {
    this.catalogoResource.reload();
  }

  protected abrirCrear(): void {
    this.abrirFormulario(null);
  }

  protected abrirEditar(item: CatalogoAdmin): void {
    this.abrirFormulario(item);
  }

  protected cambiarEstado(item: CatalogoAdmin): void {
    const activo = !item.activo;
    if (activo) {
      this.ejecutarCambioEstado(item, true);
      return;
    }

    const datos: ConfirmarAccionData = {
      titulo: `Desactivar ${this.opcion().etiquetaSingular}`,
      mensaje: `El registro «${item.nombre}» dejará de estar disponible para nuevas operaciones.`,
      detalle: 'Los datos históricos se conservan y puedes reactivarlo cuando lo necesites.',
      icono: 'toggle_off',
      etiquetaConfirmar: 'Desactivar',
      peligro: true,
    };
    this.dialog
      .open<ConfirmarAccionDialog, ConfirmarAccionData, ConfirmarAccionResultado | undefined>(
        ConfirmarAccionDialog,
        {
          data: datos,
          width: 'min(94vw, 34rem)',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
        },
      )
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === undefined) {
          return;
        }
        this.ejecutarCambioEstado(item, false);
      });
  }

  protected esInactivo(item: CatalogoAdmin): boolean {
    return !item.activo;
  }

  private abrirFormulario(item: CatalogoAdmin | null): void {
    this.dialog
      .open<CatalogoFormDialog, CatalogoFormDialogData, CatalogoAdmin>(CatalogoFormDialog, {
        data: { tipo: this.tipoSeleccionado(), item },
        width: 'min(94vw, 34rem)',
        maxWidth: '94vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === undefined) {
          return;
        }
        this.notificaciones.exito(
          item === null
            ? `Se creó ${this.opcion().etiquetaSingular} «${resultado.nombre}».`
            : `Se actualizó ${this.opcion().etiquetaSingular} «${resultado.nombre}».`,
        );
        this.catalogoResource.reload();
      });
  }

  private ejecutarCambioEstado(item: CatalogoAdmin, activo: boolean): void {
    const tipo = this.tipoSeleccionado();
    this.procesandoId.set(item.id);
    this.adminCatalogos.cambiarEstado(tipo, item.id, activo).subscribe({
      next: () => {
        this.procesandoId.set(null);
        this.notificaciones.exito(
          activo ? `Se activó «${item.nombre}».` : `Se desactivó «${item.nombre}».`,
        );
        this.catalogoResource.reload();
      },
      error: (fallo: unknown) => {
        this.procesandoId.set(null);
        this.notificaciones.error(normalizarError(fallo).mensaje);
      },
    });
  }

  private detalleItem(item: CatalogoAdmin): string | null {
    if (esDistritoAdmin(item)) {
      return `${item.provincia} · Tope de movilidad S/ ${FORMATO_MONEDA.format(item.topeMovilidad)}`;
    }
    if (esEspecialidadAdmin(item)) {
      return item.descripcion ?? 'Sin descripción registrada.';
    }
    return null;
  }
}
