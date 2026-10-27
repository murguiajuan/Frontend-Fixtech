import { TonoBadge } from '../../../core/models/etiquetas';
import { EstadoSolicitud, Urgencia } from './solicitud.models';

export const ETIQUETAS_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PUBLICADA: 'Publicada',
  CON_OFERTAS: 'Con ofertas',
  ACEPTADA: 'Aceptada',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

export const TONOS_ESTADO_SOLICITUD: Record<EstadoSolicitud, TonoBadge> = {
  PUBLICADA: 'ok',
  CON_OFERTAS: 'info',
  ACEPTADA: 'ok',
  VENCIDA: 'neutral',
  CANCELADA: 'error',
};

export const ETIQUETAS_URGENCIA: Record<Urgencia, string> = {
  BAJA: 'Urgencia baja',
  MEDIA: 'Urgencia media',
  ALTA: 'Urgencia alta',
};

export const TONOS_URGENCIA: Record<Urgencia, TonoBadge> = {
  BAJA: 'neutral',
  MEDIA: 'alerta',
  ALTA: 'error',
};

export const ESTADOS_SOLICITUD: readonly EstadoSolicitud[] = [
  'PUBLICADA',
  'CON_OFERTAS',
  'ACEPTADA',
  'VENCIDA',
  'CANCELADA',
];

export const URGENCIAS: readonly Urgencia[] = ['BAJA', 'MEDIA', 'ALTA'];

export const FILTRO_TODAS = 'TODAS' as const;

export type FiltroEstadoSolicitud = EstadoSolicitud | typeof FILTRO_TODAS;

export const OPCIONES_FILTRO_ESTADO: readonly {
  readonly valor: FiltroEstadoSolicitud;
  readonly etiqueta: string;
}[] = [
  { valor: FILTRO_TODAS, etiqueta: 'Todas' },
  ...ESTADOS_SOLICITUD.map((estado) => ({
    valor: estado,
    etiqueta: ETIQUETAS_ESTADO_SOLICITUD[estado],
  })),
];

export function esEditable(estado: EstadoSolicitud): boolean {
  return estado === 'PUBLICADA';
}

export function esCancelable(estado: EstadoSolicitud): boolean {
  return estado === 'PUBLICADA' || estado === 'CON_OFERTAS';
}
