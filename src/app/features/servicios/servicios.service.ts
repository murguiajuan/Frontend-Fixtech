import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizarError } from '../../core/http/api-error';
import {
  AjustePrecio,
  AjustePrecioRequest,
  Avance,
  AvanceRequest,
  CambioEstadoServicioRequest,
  Constancia,
  ConstanciaRequest,
  EstadoServicio,
  FinalizarServicioRequest,
  Mensaje,
  Reclamo,
  Resena,
  ResenaRequest,
  RespuestaAjusteRequest,
  ServicioDetalle,
  ServicioListado,
} from './servicio.models';

@Service()
export class ServiciosService {
  private readonly http = inject(HttpClient);

  listarMios(estado?: EstadoServicio): Observable<readonly ServicioListado[]> {
    const params = estado === undefined ? undefined : new HttpParams().set('estado', estado);
    return this.http.get<readonly ServicioListado[]>(`${environment.apiUrl}/servicios/mios`, {
      params,
    });
  }

  obtener(servicioId: number): Observable<ServicioDetalle> {
    return this.http.get<ServicioDetalle>(`${environment.apiUrl}/servicios/${servicioId}`);
  }

  cambiarEstado(servicioId: number, request: CambioEstadoServicioRequest): Observable<unknown> {
    return this.http.patch<unknown>(
      `${environment.apiUrl}/servicios/${servicioId}/estado`,
      request,
    );
  }

  finalizar(servicioId: number, request: FinalizarServicioRequest): Observable<unknown> {
    return this.http.post<unknown>(
      `${environment.apiUrl}/servicios/${servicioId}/finalizar`,
      request,
    );
  }

  confirmar(servicioId: number): Observable<unknown> {
    return this.http.post<unknown>(
      `${environment.apiUrl}/servicios/${servicioId}/conformidad`,
      null,
    );
  }

  listarAvances(servicioId: number): Observable<readonly Avance[]> {
    return this.http.get<readonly Avance[]>(
      `${environment.apiUrl}/servicios/${servicioId}/avances`,
    );
  }

  registrarAvance(
    servicioId: number,
    request: AvanceRequest,
    foto: File | null,
  ): Observable<Avance> {
    const datos = new FormData();
    datos.append('tipo', request.tipo);
    datos.append('descripcion', request.descripcion);
    if (foto !== null) {
      datos.append('foto', foto);
    }
    return this.http.post<Avance>(`${environment.apiUrl}/servicios/${servicioId}/avances`, datos);
  }

  urlFotoAvance(servicioId: number, avanceId: number): string {
    return `/api/servicios/${servicioId}/avances/${avanceId}/foto`;
  }

  listarMensajes(servicioId: number): Observable<readonly Mensaje[]> {
    return this.http.get<readonly Mensaje[]>(
      `${environment.apiUrl}/servicios/${servicioId}/mensajes`,
    );
  }

  enviarMensaje(servicioId: number, contenido: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${environment.apiUrl}/servicios/${servicioId}/mensajes`, {
      contenido,
    });
  }

  proponerAjuste(
    servicioId: number,
    request: AjustePrecioRequest,
    evidencia: File | null,
  ): Observable<AjustePrecio> {
    const datos = new FormData();
    datos.append('montoNuevo', String(request.montoNuevo));
    datos.append('justificacion', request.justificacion);
    if (evidencia !== null) {
      datos.append('evidencia', evidencia);
    }
    return this.http.post<AjustePrecio>(
      `${environment.apiUrl}/servicios/${servicioId}/ajuste-precio`,
      datos,
    );
  }

  responderAjuste(ajusteId: number, request: RespuestaAjusteRequest): Observable<AjustePrecio> {
    return this.http.patch<AjustePrecio>(
      `${environment.apiUrl}/ajustes/${ajusteId}/respuesta`,
      request,
    );
  }

  urlEvidenciaAjuste(ajusteId: number): string {
    return `/api/ajustes/${ajusteId}/evidencia`;
  }

  registrarConstancia(
    servicioId: number,
    request: ConstanciaRequest,
    fotos: readonly File[],
  ): Observable<Constancia> {
    const datos = new FormData();
    datos.append('tipo', request.tipo);
    if (request.observaciones !== null && request.observaciones.trim() !== '') {
      datos.append('observaciones', request.observaciones.trim());
    }
    if (request.accesorios !== null && request.accesorios.trim() !== '') {
      datos.append('accesorios', request.accesorios.trim());
    }
    for (const foto of fotos) {
      datos.append('fotos', foto);
    }
    return this.http.post<Constancia>(
      `${environment.apiUrl}/servicios/${servicioId}/constancias`,
      datos,
    );
  }

  confirmarConstancia(servicioId: number, constanciaId: number): Observable<Constancia> {
    return this.http.post<Constancia>(
      `${environment.apiUrl}/servicios/${servicioId}/constancias/${constanciaId}/confirmar`,
      null,
    );
  }

  urlFotoConstancia(servicioId: number, constanciaId: number, fotoId: number): string {
    return `/api/servicios/${servicioId}/constancias/${constanciaId}/fotos/${fotoId}`;
  }

  obtenerResena(servicioId: number): Observable<Resena | null> {
    return this.http.get<Resena>(`${environment.apiUrl}/servicios/${servicioId}/resenas`).pipe(
      catchError((error: unknown) => {
        const apiError = normalizarError(error);
        return apiError.estado === 404 ? of(null) : throwError(() => apiError);
      }),
    );
  }

  registrarResena(servicioId: number, request: ResenaRequest): Observable<Resena> {
    return this.http.post<Resena>(`${environment.apiUrl}/servicios/${servicioId}/resenas`, request);
  }

  responderResena(servicioId: number, resenaId: number, respuesta: string): Observable<Resena> {
    return this.http.patch<Resena>(
      `${environment.apiUrl}/servicios/${servicioId}/resenas/${resenaId}/respuesta`,
      { respuesta },
    );
  }

  reportarResena(servicioId: number, resenaId: number, motivo: string): Observable<Resena> {
    return this.http.post<Resena>(
      `${environment.apiUrl}/servicios/${servicioId}/resenas/${resenaId}/reporte`,
      { motivo },
    );
  }

  listarReclamos(servicioId: number): Observable<readonly Reclamo[]> {
    return this.http.get<readonly Reclamo[]>(
      `${environment.apiUrl}/servicios/${servicioId}/reclamos`,
    );
  }

  obtenerReclamo(servicioId: number, reclamoId: number): Observable<Reclamo> {
    return this.http.get<Reclamo>(
      `${environment.apiUrl}/servicios/${servicioId}/reclamos/${reclamoId}`,
    );
  }

  crearReclamo(
    servicioId: number,
    descripcion: string,
    fotos: readonly File[],
  ): Observable<Reclamo> {
    const datos = new FormData();
    datos.append('descripcion', descripcion);
    for (const foto of fotos) {
      datos.append('fotos', foto);
    }
    return this.http.post<Reclamo>(`${environment.apiUrl}/servicios/${servicioId}/reclamos`, datos);
  }

  responderReclamo(servicioId: number, reclamoId: number, respuesta: string): Observable<Reclamo> {
    return this.http.patch<Reclamo>(
      `${environment.apiUrl}/servicios/${servicioId}/reclamos/${reclamoId}/respuesta`,
      { respuesta },
    );
  }

  urlFotoReclamo(servicioId: number, reclamoId: number, fotoId: number): string {
    return `/api/servicios/${servicioId}/reclamos/${reclamoId}/fotos/${fotoId}`;
  }
}
