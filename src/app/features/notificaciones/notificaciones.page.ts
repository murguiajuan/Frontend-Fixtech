import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { normalizarError } from '../../core/http/api-error';
import {
  Notificacion,
  etiquetaReferencia,
  iconoNotificacion,
} from '../../core/notificaciones/notificaciones.models';
import { NotificacionesService } from '../../core/notificaciones/notificaciones.service';
import { NotificacionService } from '../../shared/ui/notificacion.service';

@Component({
  selector: 'app-notificaciones-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notificaciones.page.html',
  styleUrl: './notificaciones.page.scss',
})
export class NotificacionesPage {
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly avisos = inject(NotificacionService);

  protected readonly notificaciones = this.notificacionesService.notificaciones;
  protected readonly noLeidas = this.notificacionesService.noLeidas;
  protected readonly cargando = this.notificacionesService.cargando;
  protected readonly error = this.notificacionesService.error;
  protected readonly soloNoLeidas = this.notificacionesService.soloNoLeidas;
  protected readonly ultimaActualizacion = this.notificacionesService.ultimaActualizacion;
  protected readonly iconoNotificacion = iconoNotificacion;
  protected readonly etiquetaReferencia = etiquetaReferencia;

  protected readonly marcandoId = signal<number | null>(null);
  protected readonly marcandoTodas = signal(false);

  constructor() {
    this.recargar();
  }

  protected recargar(soloNoLeidas = this.soloNoLeidas()): void {
    this.notificacionesService.cargar(soloNoLeidas).subscribe({ error: () => undefined });
  }

  protected cambiarFiltro(soloNoLeidas: boolean): void {
    this.recargar(soloNoLeidas);
  }

  protected marcarLeida(notificacion: Notificacion): void {
    if (notificacion.leida || this.marcandoId() !== null) {
      return;
    }
    this.marcandoId.set(notificacion.id);
    this.notificacionesService.marcarLeida(notificacion.id).subscribe({
      next: () => {
        this.marcandoId.set(null);
        this.avisos.exito('Notificación marcada como leída.');
      },
      error: (error: unknown) => {
        this.marcandoId.set(null);
        this.avisos.error(normalizarError(error).mensaje);
      },
    });
  }

  protected marcarTodas(): void {
    if (this.noLeidas() === 0 || this.marcandoTodas()) {
      return;
    }
    this.marcandoTodas.set(true);
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => {
        this.marcandoTodas.set(false);
        this.avisos.exito('Todas las notificaciones se marcaron como leídas.');
      },
      error: (error: unknown) => {
        this.marcandoTodas.set(false);
        this.avisos.error(normalizarError(error).mensaje);
      },
    });
  }

  protected textoNoLeidas(): string {
    const total = this.noLeidas();
    return total === 1 ? '1 notificación sin leer' : `${total} notificaciones sin leer`;
  }
}
