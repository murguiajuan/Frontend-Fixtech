import { Comision, DeudaTecnico, MiSaldoComisiones, PagoComision } from '../comision.models';

export function crearComision(overrides: Partial<Comision> = {}): Comision {
  return {
    id: 101,
    servicioId: 21,
    montoBase: 180,
    porcentaje: 0.06,
    montoComision: 10.8,
    montoNetoTecnico: 169.2,
    estado: 'PENDIENTE',
    fechaLimitePago: '2026-11-03',
    fechaPago: null,
    creadoEn: '2026-10-27T12:00:00',
    ...overrides,
  };
}

export function crearPago(overrides: Partial<PagoComision> = {}): PagoComision {
  return {
    id: 51,
    tecnicoId: 9,
    tecnicoNombre: 'María Quispe',
    tecnicoCorreo: 'maria.quispe@fixtech.pe',
    monto: 10.8,
    metodo: 'YAPE',
    numeroOperacion: 'OP-2026-001',
    estado: 'PENDIENTE',
    observacion: null,
    fechaValidacion: null,
    creadoEn: '2026-10-27T13:00:00',
    tieneComprobante: true,
    comisiones: [crearComision()],
    ...overrides,
  };
}

export function crearSaldo(overrides: Partial<MiSaldoComisiones> = {}): MiSaldoComisiones {
  return {
    saldoPendiente: 10.8,
    totalPagado: 0,
    limiteDeuda: 30,
    bloqueadoPorDeuda: false,
    comisionesVencidas: 0,
    proximoVencimiento: '2026-11-03',
    comisionesPendientes: [crearComision()],
    pagos: [],
    ...overrides,
  };
}

export function crearDeuda(overrides: Partial<DeudaTecnico> = {}): DeudaTecnico {
  return {
    tecnicoId: 9,
    tecnicoNombre: 'María Quispe',
    correo: 'maria.quispe@fixtech.pe',
    saldoPendiente: 10.8,
    limiteDeuda: 30,
    bloqueadoPorDeuda: false,
    comisionesPendientes: 1,
    comisionesVencidas: 0,
    proximoVencimiento: '2026-11-03',
    ...overrides,
  };
}
