import { Modalidad } from '../../../core/auth/auth.models';

export type EstadoSolicitud = 'PUBLICADA' | 'CON_OFERTAS' | 'ACEPTADA' | 'VENCIDA' | 'CANCELADA';

export type Urgencia = 'BAJA' | 'MEDIA' | 'ALTA';

export interface SolicitudRequest {
  readonly tipoEquipoId: number;
  readonly tipoServicioId: number;
  readonly marca: string | null;
  readonly modelo: string | null;
  readonly descripcion: string;
  readonly urgencia: Urgencia;
  readonly modalidad: Modalidad;
  readonly distritoId: number;
  readonly direccion: string | null;
  readonly referencia: string | null;
  readonly fechaPreferida: string | null;
  readonly horarioPreferido: string | null;
  readonly presupuestoReferencial: number | null;
}

export interface ImagenSolicitud {
  readonly id: number;
  readonly orden: number;
  readonly url: string;
}

export interface SolicitudResumen {
  readonly id: number;
  readonly estado: EstadoSolicitud;
  readonly urgencia: Urgencia;
  readonly modalidad: Modalidad;
  readonly tipoEquipo: string;
  readonly tipoServicio: string;
  readonly distrito: string;
  readonly marca: string | null;
  readonly modelo: string | null;
  readonly descripcion: string;
  readonly presupuestoReferencial: number | null;
  readonly fechaVencimiento: string;
  readonly creadoEn: string;
  readonly imagenPrincipalUrl: string | null;
}

export interface SolicitudDetalle extends SolicitudResumen {
  readonly tipoEquipoId: number;
  readonly tipoServicioId: number;
  readonly distritoId: number;
  readonly direccion: string | null;
  readonly referencia: string | null;
  readonly fechaPreferida: string | null;
  readonly horarioPreferido: string | null;
  readonly motivoCancelacion: string | null;
  readonly imagenes: readonly ImagenSolicitud[];
}
