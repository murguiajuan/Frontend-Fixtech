import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiError, normalizarError } from '../http/api-error';
import { SILENCIAR_ERROR } from '../http/silenciar-error';
import { Notificacion, NotificacionesResponse } from './notificaciones.models';

const URL_NOTIFICACIONES = `${environment.apiUrl}/notificaciones`;
const INTERVALO_POLLING_MS = 60_000;

@Service()
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  private readonly notificacionesState = signal<readonly Notificacion[]>([]);
  private readonly noLeidasState = signal(0);
  private readonly cargandoState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly soloNoLeidasState = signal(false);
  private readonly ultimaActualizacionState = signal<Date | null>(null);

  private intervalo: ReturnType<typeof setInterval> | null = null;

  readonly notificaciones = this.notificacionesState.asReadonly();
  readonly noLeidas = this.noLeidasState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly soloNoLeidas = this.soloNoLeidasState.asReadonly();
  readonly ultimaActualizacion = this.ultimaActualizacionState.asReadonly();

  cargar(soloNoLeidas = this.soloNoLeidasState()): Observable<NotificacionesResponse> {
    if (this.soloNoLeidasState() !== soloNoLeidas) {
      this.notificacionesState.set([]);
      this.soloNoLeidasState.set(soloNoLeidas);
    }
    this.cargandoState.set(true);
    this.errorState.set(null);
    const params = new HttpParams().set('soloNoLeidas', soloNoLeidas);

    return this.http.get<NotificacionesResponse>(URL_NOTIFICACIONES, { params }).pipe(
      tap((respuesta) => {
        this.notificacionesState.set(respuesta.notificaciones);
        this.noLeidasState.set(respuesta.noLeidas);
        this.ultimaActualizacionState.set(new Date());
      }),
      catchError((error: unknown) => {
        this.errorState.set(normalizarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.cargandoState.set(false)),
    );
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http
      .patch<Notificacion>(`${URL_NOTIFICACIONES}/${id}/leer`, {})
      .pipe(tap((actualizada) => this.actualizarLeida(actualizada)));
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.patch<void>(`${URL_NOTIFICACIONES}/leer-todas`, {}).pipe(
      tap(() => {
        this.notificacionesState.update((lista) =>
          this.soloNoLeidasState()
            ? []
            : lista.map((notificacion) => ({ ...notificacion, leida: true })),
        );
        this.noLeidasState.set(0);
      }),
    );
  }

  /**
   * Actualiza solo el contador de no leídas para el badge del layout. La petición
   * se marca como silenciosa para no repetir avisos globales cada minuto.
   */
  refrescarContador(): void {
    const params = new HttpParams().set('soloNoLeidas', true);
    this.http
      .get<NotificacionesResponse>(URL_NOTIFICACIONES, {
        params,
        context: new HttpContext().set(SILENCIAR_ERROR, true),
      })
      .pipe(
        tap((respuesta) => this.noLeidasState.set(respuesta.noLeidas)),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  iniciarPolling(intervaloMs = INTERVALO_POLLING_MS): () => void {
    this.detenerPolling();
    this.refrescarContador();
    this.intervalo = setInterval(() => this.refrescarContador(), intervaloMs);
    return () => this.detenerPolling();
  }

  limpiar(): void {
    this.detenerPolling();
    this.notificacionesState.set([]);
    this.noLeidasState.set(0);
    this.cargandoState.set(false);
    this.errorState.set(null);
    this.soloNoLeidasState.set(false);
    this.ultimaActualizacionState.set(null);
  }

  private actualizarLeida(actualizada: Notificacion): void {
    const previa = this.notificacionesState().find(
      (notificacion) => notificacion.id === actualizada.id,
    );
    this.notificacionesState.update((lista) =>
      this.soloNoLeidasState()
        ? lista.filter((notificacion) => notificacion.id !== actualizada.id)
        : lista.map((notificacion) =>
            notificacion.id === actualizada.id ? actualizada : notificacion,
          ),
    );
    if (previa !== undefined && !previa.leida) {
      this.noLeidasState.update((total) => Math.max(0, total - 1));
    }
  }

  private detenerPolling(): void {
    if (this.intervalo !== null) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }
}
