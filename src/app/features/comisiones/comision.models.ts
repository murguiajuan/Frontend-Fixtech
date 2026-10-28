import { MetodoPago } from '../servicios/servicio.models';

export type EstadoComision = 'PENDIENTE' | 'PAGADA' | 'ANULADA';
export type EstadoPagoComision = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';
export type MetodoPagoComision = Exclude<MetodoPago, 'EFECTIVO'>;
export type FiltroEstadoPago = EstadoPagoComision | 'TODOS';
export type DecisionPago = Extract<EstadoPagoComision, 'VALIDADO' | 'RECHAZADO'>;

export interface Comision {
  readonly id: number;
  readonly servicioId: number;
  readonly montoBase: number;
  readonly porcentaje: number;
  readonly montoComision: number;
  readonly montoNetoTecnico: number;
  readonly estado: EstadoComision;
  readonly fechaLimitePago: string;
  readonly fechaPago: string | null;
  readonly creadoEn: string;
}

export interface PagoComision {
  readonly id: number;
  readonly tecnicoId: number;
  readonly tecnicoNombre: string;
  readonly tecnicoCorreo: string;
  readonly monto: number;
  readonly metodo: MetodoPago;
  readonly numeroOperacion: string;
  readonly estado: EstadoPagoComision;
  readonly observacion: string | null;
  readonly fechaValidacion: string | null;
  readonly creadoEn: string;
  readonly tieneComprobante: boolean;
  readonly comisiones: readonly Comision[];
}

export interface MiSaldoComisiones {
  readonly saldoPendiente: number;
  readonly totalPagado: number;
  readonly limiteDeuda: number;
  readonly bloqueadoPorDeuda: boolean;
  readonly comisionesVencidas: number;
  readonly proximoVencimiento: string | null;
  readonly comisionesPendientes: readonly Comision[];
  readonly pagos: readonly PagoComision[];
}

export interface RegistrarPagoComisionRequest {
  readonly comisionIds: readonly number[];
  readonly metodo: MetodoPagoComision;
  readonly numeroOperacion: string;
  readonly comprobante: File;
}

export interface ValidacionPagoComisionRequest {
  readonly estado: DecisionPago;
  readonly observacion: string | null;
}

export interface DeudaTecnico {
  readonly tecnicoId: number;
  readonly tecnicoNombre: string;
  readonly correo: string;
  readonly saldoPendiente: number;
  readonly limiteDeuda: number;
  readonly bloqueadoPorDeuda: boolean;
  readonly comisionesPendientes: number;
  readonly comisionesVencidas: number;
  readonly proximoVencimiento: string | null;
}

export interface FiltrosPagosComision {
  readonly estado: FiltroEstadoPago;
}
