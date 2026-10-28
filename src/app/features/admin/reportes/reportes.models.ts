import { EstadoReclamo, EstadoServicio } from '../../servicios/servicio.models';
import { diferenciaDias, esFechaValida, RangoFechas } from '../../../core/models/fechas';

export interface TecnicoActividad {
  readonly tecnicoId: number;
  readonly nombre: string;
  readonly servicios: number;
  readonly calificacionPromedio: number;
}

export interface IngresoMensual {
  readonly mes: string;
  readonly servicios: number;
  readonly volumenTotal: number;
  readonly ingresoFixtech: number;
}

export type ConteoServicios = Partial<Record<EstadoServicio, number>>;
export type ConteoReclamos = Partial<Record<EstadoReclamo, number>>;

export interface DashboardAdmin {
  readonly totalSolicitudes: number;
  readonly solicitudesSinOfertas: number;
  readonly totalServicios: number;
  readonly serviciosPorEstado: ConteoServicios;
  readonly ingresoTotalComisiones: number;
  readonly ingresoMesActual: number;
  readonly comisionesPendientes: number;
  readonly deudaComisionesPendiente: number;
  readonly pagosPorValidar: number;
  readonly tecnicosActivos: number;
  readonly calificacionPromedio: number;
  readonly totalResenas: number;
  readonly reclamosAbiertos: number;
  readonly resenasReportadas: number;
  readonly tecnicosMasActivos: readonly TecnicoActividad[];
}

export interface ReporteAdmin {
  readonly desde: string;
  readonly hasta: string;
  readonly totalSolicitudes: number;
  readonly solicitudesSinOfertas: number;
  readonly totalServicios: number;
  readonly serviciosPorEstado: ConteoServicios;
  readonly volumenServicios: number;
  readonly ingresoComisiones: number;
  readonly ingresosPorMes: readonly IngresoMensual[];
  readonly tecnicosMasActivos: readonly TecnicoActividad[];
  readonly calificacionPromedio: number;
  readonly totalResenas: number;
  readonly totalReclamos: number;
  readonly reclamosPorEstado: ConteoReclamos;
}

export type FiltrosReporte = RangoFechas;

export const MAX_DIAS_REPORTE = 366;

export const ORDEN_ESTADOS_SERVICIO: readonly EstadoServicio[] = [
  'PROGRAMADO',
  'TECNICO_EN_CAMINO',
  'EQUIPO_RECIBIDO',
  'EN_DIAGNOSTICO',
  'PENDIENTE_AJUSTE',
  'EN_PROCESO',
  'EN_REPARACION',
  'LISTO_PARA_RECOGER',
  'FINALIZADO',
  'CONFIRMADO',
  'CALIFICADO',
  'CANCELADO',
];

export const ORDEN_ESTADOS_RECLAMO: readonly EstadoReclamo[] = [
  'ABIERTO',
  'EN_REVISION',
  'RESUELTO',
  'CERRADO',
];

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export function validarFiltrosReporte(desde: string, hasta: string): string | null {
  if (desde === '' || hasta === '') {
    return 'Debe indicar la fecha de inicio y de fin.';
  }
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return 'Las fechas indicadas no son válidas.';
  }
  if (hasta < desde) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }
  const dias = diferenciaDias(desde, hasta);
  if (dias === null) {
    return 'Las fechas indicadas no son válidas.';
  }
  if (dias >= MAX_DIAS_REPORTE) {
    return `El periodo no puede superar los ${MAX_DIAS_REPORTE} días.`;
  }
  return null;
}

export function etiquetaMes(mes: string): string {
  const coincidencia = /^(\d{4})-(\d{2})/.exec(mes);
  if (coincidencia === null) {
    return mes;
  }
  const anio = Number(coincidencia[1]);
  const indice = Number(coincidencia[2]) - 1;
  const nombre = MESES[indice];
  return nombre === undefined ? mes : `${nombre} ${anio}`;
}
