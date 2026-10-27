import { TonoBadge } from '../../core/models/etiquetas';
import {
  Contraoferta,
  EmisorContraoferta,
  EstadoContraoferta,
  EstadoOferta,
  Oferta,
  OfertaOrden,
} from './oferta.models';

export const ETIQUETAS_ESTADO_OFERTA: Record<EstadoOferta, string> = {
  ENVIADA: 'Enviada',
  CONTRAOFERTADA: 'En contraoferta',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  RETIRADA: 'Retirada',
  EXPIRADA: 'Expirada',
};

export const TONOS_ESTADO_OFERTA: Record<EstadoOferta, TonoBadge> = {
  ENVIADA: 'info',
  CONTRAOFERTADA: 'alerta',
  ACEPTADA: 'ok',
  RECHAZADA: 'error',
  RETIRADA: 'neutral',
  EXPIRADA: 'neutral',
};

export const ETIQUETAS_EMISOR: Record<EmisorContraoferta, string> = {
  CLIENTE: 'Cliente',
  TECNICO: 'Técnico',
};

export const ETIQUETAS_ESTADO_CONTRAOFERTA: Record<EstadoContraoferta, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  SUPERADA: 'Superada',
};

export const TONOS_ESTADO_CONTRAOFERTA: Record<EstadoContraoferta, TonoBadge> = {
  PENDIENTE: 'alerta',
  ACEPTADA: 'ok',
  RECHAZADA: 'error',
  SUPERADA: 'neutral',
};

export const ETIQUETAS_ORDEN: Record<OfertaOrden, string> = {
  PRECIO: 'Menor precio',
  CALIFICACION: 'Mejor calificación',
  TIEMPO: 'Menor tiempo',
};

export const ORDENES_OFERTA: readonly OfertaOrden[] = ['PRECIO', 'CALIFICACION', 'TIEMPO'];

export function estaActiva(estado: EstadoOferta): boolean {
  return estado === 'ENVIADA' || estado === 'CONTRAOFERTADA';
}

export function puedeVolverAEnviar(estado: EstadoOferta): boolean {
  return estado === 'RECHAZADA' || estado === 'RETIRADA' || estado === 'EXPIRADA';
}

export function contraofertaPendiente(oferta: Oferta): Contraoferta | null {
  const pendientes = oferta.contraofertas.filter(
    (contraoferta) => contraoferta.estado === 'PENDIENTE',
  );
  return pendientes.at(-1) ?? null;
}

export function puedeIniciarContraoferta(oferta: Oferta, emisor: EmisorContraoferta): boolean {
  return (
    estaActiva(oferta.estado) && emisor === 'CLIENTE' && contraofertaPendiente(oferta) === null
  );
}

export function puedeResponderContraoferta(oferta: Oferta, emisor: EmisorContraoferta): boolean {
  const pendiente = contraofertaPendiente(oferta);
  return estaActiva(oferta.estado) && pendiente !== null && pendiente.emisor !== emisor;
}

export function esperaRespuestaDeLaOtraParte(oferta: Oferta, emisor: EmisorContraoferta): boolean {
  const pendiente = contraofertaPendiente(oferta);
  return estaActiva(oferta.estado) && pendiente !== null && pendiente.emisor === emisor;
}
