import { TonoBadge } from '../../core/models/etiquetas';
import { MetodoPago } from '../servicios/servicio.models';
import {
  DecisionPago,
  EstadoComision,
  EstadoPagoComision,
  MetodoPagoComision,
} from './comision.models';

export const ESTADOS_COMISION: readonly EstadoComision[] = ['PENDIENTE', 'PAGADA', 'ANULADA'];

export const ETIQUETAS_ESTADO_COMISION: Record<EstadoComision, string> = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
};

export const TONOS_ESTADO_COMISION: Record<EstadoComision, TonoBadge> = {
  PENDIENTE: 'alerta',
  PAGADA: 'ok',
  ANULADA: 'neutral',
};

export const ESTADOS_PAGO: readonly EstadoPagoComision[] = ['PENDIENTE', 'VALIDADO', 'RECHAZADO'];

export const ETIQUETAS_ESTADO_PAGO: Record<EstadoPagoComision, string> = {
  PENDIENTE: 'En revisión',
  VALIDADO: 'Validado',
  RECHAZADO: 'Rechazado',
};

export const TONOS_ESTADO_PAGO: Record<EstadoPagoComision, TonoBadge> = {
  PENDIENTE: 'alerta',
  VALIDADO: 'ok',
  RECHAZADO: 'error',
};

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia bancaria',
};

export const METODOS_PAGO_COMISION: readonly MetodoPagoComision[] = [
  'YAPE',
  'PLIN',
  'TRANSFERENCIA',
];

export const ETIQUETAS_DECISION_PAGO: Record<DecisionPago, string> = {
  VALIDADO: 'Validar pago',
  RECHAZADO: 'Rechazar pago',
};

export function esPagoActivo(estado: EstadoPagoComision): boolean {
  return estado === 'PENDIENTE' || estado === 'VALIDADO';
}
