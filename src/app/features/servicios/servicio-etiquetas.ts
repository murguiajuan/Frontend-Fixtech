import { Modalidad } from '../../core/auth/auth.models';
import { TonoBadge } from '../../core/models/etiquetas';
import {
  Avance,
  CanceladoPor,
  Constancia,
  EstadoAjuste,
  EstadoReclamo,
  EstadoResena,
  EstadoServicio,
  MetodoPago,
  Reclamo,
  Resena,
  ServicioDetalle,
  TipoAvance,
  TipoConstancia,
} from './servicio.models';

export const ETIQUETAS_ESTADO_SERVICIO: Record<EstadoServicio, string> = {
  PROGRAMADO: 'Programado',
  TECNICO_EN_CAMINO: 'Técnico en camino',
  EQUIPO_RECIBIDO: 'Equipo recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PENDIENTE_AJUSTE: 'Ajuste pendiente',
  EN_PROCESO: 'En proceso',
  EN_REPARACION: 'En reparación',
  LISTO_PARA_RECOGER: 'Listo para recoger',
  FINALIZADO: 'Finalizado',
  CONFIRMADO: 'Confirmado',
  CALIFICADO: 'Calificado',
  CANCELADO: 'Cancelado',
};

export const TONOS_ESTADO_SERVICIO: Record<EstadoServicio, TonoBadge> = {
  PROGRAMADO: 'info',
  TECNICO_EN_CAMINO: 'alerta',
  EQUIPO_RECIBIDO: 'info',
  EN_DIAGNOSTICO: 'info',
  PENDIENTE_AJUSTE: 'alerta',
  EN_PROCESO: 'info',
  EN_REPARACION: 'info',
  LISTO_PARA_RECOGER: 'alerta',
  FINALIZADO: 'alerta',
  CONFIRMADO: 'ok',
  CALIFICADO: 'ok',
  CANCELADO: 'error',
};

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia bancaria',
};

export const METODOS_PAGO: readonly MetodoPago[] = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'];

export const ETIQUETAS_TIPO_AVANCE: Record<TipoAvance, string> = {
  DIAGNOSTICO: 'Diagnóstico',
  AVANCE: 'Avance',
};

export const ETIQUETAS_TIPO_CONSTANCIA: Record<TipoConstancia, string> = {
  RECEPCION: 'Recepción del equipo',
  ENTREGA: 'Entrega del equipo',
};

export const ETIQUETAS_ESTADO_RESENA: Record<EstadoResena, string> = {
  VISIBLE: 'Visible',
  OCULTA: 'Oculta',
  REPORTADA: 'Reportada',
};

export const TONOS_ESTADO_RESENA: Record<EstadoResena, TonoBadge> = {
  VISIBLE: 'ok',
  OCULTA: 'neutral',
  REPORTADA: 'alerta',
};

export const ETIQUETAS_ESTADO_RECLAMO: Record<EstadoReclamo, string> = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revisión',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};

export const TONOS_ESTADO_RECLAMO: Record<EstadoReclamo, TonoBadge> = {
  ABIERTO: 'alerta',
  EN_REVISION: 'info',
  RESUELTO: 'ok',
  CERRADO: 'neutral',
};

export const ETIQUETAS_CRITERIOS_RESENA = {
  puntualidad: 'Puntualidad',
  trato: 'Trato',
  calidad: 'Calidad',
  precioJusto: 'Precio justo',
} as const;

export const ETIQUETAS_AJUSTE: Record<EstadoAjuste, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const TONOS_AJUSTE: Record<EstadoAjuste, TonoBadge> = {
  PENDIENTE: 'alerta',
  APROBADO: 'ok',
  RECHAZADO: 'error',
};

export const ETIQUETAS_CANCELADO_POR: Record<CanceladoPor, string> = {
  CLIENTE: 'Cliente',
  TECNICO: 'Técnico',
  SISTEMA: 'Sistema',
};

const ESTADOS_EN_CURSO: readonly EstadoServicio[] = [
  'PROGRAMADO',
  'TECNICO_EN_CAMINO',
  'EQUIPO_RECIBIDO',
  'EN_DIAGNOSTICO',
  'PENDIENTE_AJUSTE',
  'EN_PROCESO',
  'EN_REPARACION',
  'LISTO_PARA_RECOGER',
];

const ESTADOS_CANCELABLES: readonly EstadoServicio[] = [
  'PROGRAMADO',
  'TECNICO_EN_CAMINO',
  'EQUIPO_RECIBIDO',
  'EN_DIAGNOSTICO',
  'PENDIENTE_AJUSTE',
  'EN_PROCESO',
  'EN_REPARACION',
  'LISTO_PARA_RECOGER',
];

const ESTADOS_CON_AVANCES: readonly EstadoServicio[] = [
  'EQUIPO_RECIBIDO',
  'EN_PROCESO',
  'EN_DIAGNOSTICO',
  'EN_REPARACION',
  'LISTO_PARA_RECOGER',
];

const ESTADOS_PROPONIBLES_AJUSTE: readonly EstadoServicio[] = [
  'EN_DIAGNOSTICO',
  'EN_PROCESO',
  'EN_REPARACION',
];

export const ETIQUETAS_ESTADOS_ACTIVOS: Record<EstadoServicio, string> = ETIQUETAS_ESTADO_SERVICIO;

export type FiltroServicio = 'TODOS' | 'EN_CURSO' | 'POR_CONFIRMAR' | 'CERRADOS' | 'CANCELADOS';

export interface OpcionFiltroServicio {
  readonly valor: FiltroServicio;
  readonly etiqueta: string;
}

export const FILTRO_SERVICIO_TODOS: FiltroServicio = 'TODOS';

export const OPCIONES_FILTRO_SERVICIO: readonly OpcionFiltroServicio[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'EN_CURSO', etiqueta: 'En curso' },
  { valor: 'POR_CONFIRMAR', etiqueta: 'Por confirmar' },
  { valor: 'CERRADOS', etiqueta: 'Cerrados' },
  { valor: 'CANCELADOS', etiqueta: 'Cancelados' },
];

export interface AccionEstado {
  readonly estado: EstadoServicio;
  readonly etiqueta: string;
  readonly icono: string;
}

export interface AccionEstadoReclamo {
  readonly estado: EstadoReclamo;
  readonly etiqueta: string;
  readonly icono: string;
}

export function esServicioEnCurso(estado: EstadoServicio): boolean {
  return ESTADOS_EN_CURSO.includes(estado);
}

export function esCancelableServicio(estado: EstadoServicio): boolean {
  return ESTADOS_CANCELABLES.includes(estado);
}

export function permiteAvances(estado: EstadoServicio): boolean {
  return ESTADOS_CON_AVANCES.includes(estado);
}

export function permiteProponerAjuste(estado: EstadoServicio): boolean {
  return ESTADOS_PROPONIBLES_AJUSTE.includes(estado);
}

export function tiposAvanceDisponibles(estado: EstadoServicio): readonly TipoAvance[] {
  if (!permiteAvances(estado)) {
    return [];
  }
  return estado === 'EN_DIAGNOSTICO' ? ['DIAGNOSTICO', 'AVANCE'] : ['AVANCE'];
}

export function transicionesTecnico(
  servicio: Pick<ServicioDetalle, 'estado' | 'modalidad'>,
): readonly AccionEstado[] {
  switch (servicio.estado) {
    case 'PROGRAMADO':
      return servicio.modalidad === 'DOMICILIO'
        ? [{ estado: 'TECNICO_EN_CAMINO', etiqueta: 'Iniciar traslado', icono: 'directions_car' }]
        : [];
    case 'TECNICO_EN_CAMINO':
      return [{ estado: 'EN_PROCESO', etiqueta: 'Validar PIN e iniciar', icono: 'pin' }];
    case 'EQUIPO_RECIBIDO':
      return [{ estado: 'EN_DIAGNOSTICO', etiqueta: 'Iniciar diagnóstico', icono: 'troubleshoot' }];
    case 'EN_PROCESO':
      return [
        { estado: 'EN_DIAGNOSTICO', etiqueta: 'Registrar diagnóstico', icono: 'troubleshoot' },
      ];
    case 'EN_DIAGNOSTICO':
      return servicio.modalidad === 'DOMICILIO'
        ? [{ estado: 'EN_PROCESO', etiqueta: 'Reanudar trabajo', icono: 'play_arrow' }]
        : [{ estado: 'EN_REPARACION', etiqueta: 'Iniciar reparación', icono: 'build' }];
    case 'EN_REPARACION':
      return [
        {
          estado: 'LISTO_PARA_RECOGER',
          etiqueta: 'Marcar listo para recoger',
          icono: 'inventory_2',
        },
      ];
    default:
      return [];
  }
}

export function puedeFinalizarServicio(
  servicio: Pick<ServicioDetalle, 'estado' | 'modalidad' | 'pinValidado' | 'constancias'>,
): boolean {
  if (servicio.modalidad === 'DOMICILIO') {
    return servicio.estado === 'EN_PROCESO' && servicio.pinValidado;
  }
  return (
    servicio.modalidad === 'TALLER' &&
    servicio.estado === 'LISTO_PARA_RECOGER' &&
    tieneConstancia(servicio, 'ENTREGA')
  );
}

export function tieneConstancia(
  servicio: Pick<ServicioDetalle, 'constancias'>,
  tipo: TipoConstancia,
): boolean {
  return servicio.constancias.some((constancia) => constancia.tipo === tipo);
}

export function puedeRegistrarConstancia(
  servicio: Pick<ServicioDetalle, 'estado' | 'modalidad' | 'constancias'>,
  tipo: TipoConstancia,
): boolean {
  if (servicio.modalidad !== 'TALLER' || tieneConstancia(servicio, tipo)) {
    return false;
  }
  if (tipo === 'RECEPCION') {
    return servicio.estado === 'PROGRAMADO' || servicio.estado === 'EQUIPO_RECIBIDO';
  }
  return servicio.estado === 'LISTO_PARA_RECOGER';
}

export function puedeConfirmarConstancia(
  esCliente: boolean,
  constancia: Pick<Constancia, 'confirmadaPorCliente'>,
): boolean {
  return esCliente && !constancia.confirmadaPorCliente;
}

export function requiereConstanciaRecepcion(
  servicio: Pick<ServicioDetalle, 'estado' | 'modalidad' | 'constancias'>,
): boolean {
  return (
    servicio.modalidad === 'TALLER' &&
    !tieneConstancia(servicio, 'RECEPCION') &&
    (servicio.estado === 'PROGRAMADO' || servicio.estado === 'EQUIPO_RECIBIDO')
  );
}

export function requiereConstanciaEntrega(
  servicio: Pick<ServicioDetalle, 'estado' | 'modalidad' | 'constancias'>,
): boolean {
  return (
    servicio.modalidad === 'TALLER' &&
    servicio.estado === 'LISTO_PARA_RECOGER' &&
    !tieneConstancia(servicio, 'ENTREGA')
  );
}

export function puedeCrearResena(estado: EstadoServicio): boolean {
  return estado === 'CONFIRMADO';
}

export function puedeResponderResena(resena: Resena, esTecnico: boolean): boolean {
  return esTecnico && resena.estado === 'VISIBLE' && resena.respuestaTecnico === null;
}

export function puedeReportarResena(resena: Resena, esTecnico: boolean): boolean {
  return esTecnico && resena.estado === 'VISIBLE';
}

export function esReclamoActivo(estado: EstadoReclamo): boolean {
  return estado === 'ABIERTO' || estado === 'EN_REVISION';
}

export function puedeCrearReclamo(estado: EstadoServicio, reclamos: readonly Reclamo[]): boolean {
  return (
    (estado === 'CONFIRMADO' || estado === 'CALIFICADO') &&
    !reclamos.some((reclamo) => esReclamoActivo(reclamo.estado))
  );
}

export function puedeResponderReclamo(reclamo: Reclamo, esTecnico: boolean): boolean {
  return esTecnico && esReclamoActivo(reclamo.estado) && reclamo.respuestaTecnico === null;
}

export function transicionesReclamo(estado: EstadoReclamo): readonly AccionEstadoReclamo[] {
  switch (estado) {
    case 'ABIERTO':
      return [{ estado: 'EN_REVISION', etiqueta: 'Iniciar revisión', icono: 'manage_search' }];
    case 'EN_REVISION':
      return [
        { estado: 'RESUELTO', etiqueta: 'Resolver reclamo', icono: 'task_alt' },
        { estado: 'CERRADO', etiqueta: 'Cerrar reclamo', icono: 'lock' },
      ];
    case 'RESUELTO':
      return [{ estado: 'CERRADO', etiqueta: 'Cerrar reclamo', icono: 'lock' }];
    case 'CERRADO':
      return [];
  }
}

export function puedeConfirmarConformidad(estado: EstadoServicio): boolean {
  return estado === 'FINALIZADO';
}

export function coincideFiltroServicio(estado: EstadoServicio, filtro: FiltroServicio): boolean {
  switch (filtro) {
    case 'TODOS':
      return true;
    case 'EN_CURSO':
      return esServicioEnCurso(estado);
    case 'POR_CONFIRMAR':
      return estado === 'FINALIZADO';
    case 'CERRADOS':
      return estado === 'CONFIRMADO' || estado === 'CALIFICADO';
    case 'CANCELADOS':
      return estado === 'CANCELADO';
  }
}

export function esModalidadDomicilio(modalidad: Modalidad): boolean {
  return modalidad === 'DOMICILIO';
}

export function descripcionAvance(avance: Avance): string {
  return `${ETIQUETAS_TIPO_AVANCE[avance.tipo]}: ${avance.descripcion}`;
}
