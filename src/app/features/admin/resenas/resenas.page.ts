import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { normalizarError } from '../../../core/http/api-error';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import {
  ConfirmarAccionData,
  ConfirmarAccionDialog,
  ConfirmarAccionResultado,
} from '../../../shared/ui/confirmar-accion-dialog';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ESTADOS_RESENA, FiltroEstadoResena, FiltrosResenas } from '../admin.models';
import { AdminResenasService } from '../services/admin-resenas.service';
import { Resena } from '../../servicios/servicio.models';
import { ETIQUETAS_ESTADO_RESENA, TONOS_ESTADO_RESENA } from '../../servicios/servicio-etiquetas';

@Component({
  selector: 'app-admin-resenas-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EstadoBadge,
  ],
  templateUrl: './resenas.page.html',
  styleUrl: './resenas.page.scss',
})
export class AdminResenasPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminResenas = inject(AdminResenasService);
  private readonly dialog = inject(MatDialog);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_RESENA;
  protected readonly tonosEstado = TONOS_ESTADO_RESENA;
  protected readonly estados = ESTADOS_RESENA;
  protected readonly moderando = signal<number | null>(null);

  protected readonly formularioFiltros = this.fb.group({
    estado: this.fb.control<FiltroEstadoResena>('TODOS'),
  });

  private readonly filtrosAplicados = signal<FiltrosResenas>({ estado: 'TODOS' });

  protected readonly resenasResource = rxResource<readonly Resena[], FiltrosResenas>({
    params: () => this.filtrosAplicados(),
    stream: ({ params }) => this.adminResenas.listar(params),
  });

  protected readonly error = computed(() => {
    const fallo = this.resenasResource.error();
    return fallo === undefined ? null : normalizarError(fallo);
  });

  protected readonly reportadas = computed(() =>
    this.resenasResource.hasValue()
      ? this.resenasResource.value().filter((resena) => resena.estado === 'REPORTADA').length
      : 0,
  );

  protected readonly resenasOrdenadas = computed(() => {
    if (!this.resenasResource.hasValue()) {
      return undefined;
    }
    return [...this.resenasResource.value()].sort(
      (a, b) => Number(b.estado === 'REPORTADA') - Number(a.estado === 'REPORTADA'),
    );
  });

  protected readonly hayFiltros = computed(() => this.filtrosAplicados().estado !== 'TODOS');

  protected aplicarFiltros(): void {
    this.filtrosAplicados.set({ estado: this.formularioFiltros.getRawValue().estado });
  }

  protected limpiarFiltros(): void {
    this.formularioFiltros.reset({ estado: 'TODOS' });
    this.filtrosAplicados.set({ estado: 'TODOS' });
  }

  protected recargar(): void {
    this.resenasResource.reload();
  }

  protected moderar(resena: Resena, estado: 'VISIBLE' | 'OCULTA'): void {
    if (this.moderando() !== null) {
      return;
    }
    const habilitar = estado === 'VISIBLE';
    const datos: ConfirmarAccionData = {
      titulo: habilitar ? 'Habilitar reseña' : 'Ocultar reseña',
      mensaje: habilitar
        ? 'La reseña volverá a mostrarse en el perfil del técnico y se quitará el motivo del reporte.'
        : 'La reseña dejará de mostrarse en el perfil del técnico y no contará para su calificación.',
      detalle: `Reseña del servicio #${resena.servicioId} de ${resena.clienteNombre}.`,
      icono: habilitar ? 'visibility' : 'visibility_off',
      etiquetaConfirmar: habilitar ? 'Habilitar reseña' : 'Ocultar reseña',
      peligro: !habilitar,
    };
    const referencia: MatDialogRef<ConfirmarAccionDialog, ConfirmarAccionResultado | undefined> =
      this.dialog.open<ConfirmarAccionDialog, ConfirmarAccionData>(ConfirmarAccionDialog, {
        data: datos,
        width: 'min(94vw, 34rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });

    referencia.afterClosed().subscribe((resultado) => {
      if (resultado === undefined) {
        return;
      }
      this.moderando.set(resena.id);
      this.adminResenas.moderar(resena.id, estado).subscribe({
        next: () => {
          this.moderando.set(null);
          this.notificaciones.exito(
            habilitar ? 'Reseña habilitada nuevamente.' : 'Reseña ocultada del perfil público.',
          );
          this.resenasResource.reload();
        },
        error: (error: unknown) => {
          this.moderando.set(null);
          this.notificaciones.error(normalizarError(error).mensaje);
          this.resenasResource.reload();
        },
      });
    });
  }

  protected ariaEstrellas(resena: Resena): string {
    return `Calificación: ${resena.estrellas} de 5 estrellas`;
  }

  protected criterios(resena: Resena): readonly string[] {
    const criterios: string[] = [];
    if (resena.puntualidad !== null) {
      criterios.push(`Puntualidad ${resena.puntualidad}/5`);
    }
    if (resena.trato !== null) {
      criterios.push(`Trato ${resena.trato}/5`);
    }
    if (resena.calidad !== null) {
      criterios.push(`Calidad ${resena.calidad}/5`);
    }
    if (resena.precioJusto !== null) {
      criterios.push(`Precio justo ${resena.precioJusto}/5`);
    }
    return criterios;
  }
}
