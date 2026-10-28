import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AjustePrecio,
  AjustePrecioRequest,
  Avance,
  AvanceRequest,
  CambioEstadoServicioRequest,
  EstadoServicio,
  FinalizarServicioRequest,
  Mensaje,
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
}
