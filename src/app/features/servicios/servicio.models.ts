import { Modalidad } from '../../core/auth/auth.models';
import { Urgencia } from '../cliente/solicitudes/solicitud.models';

export type EstadoServicio =
  | 'PROGRAMADO'
  | 'TECNICO_EN_CAMINO'
  | 'EQUIPO_RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'PENDIENTE_AJUSTE'
  | 'EN_PROCESO'
  | 'EN_REPARACION'
  | 'LISTO_PARA_RECOGER'
  | 'FINALIZADO'
  | 'CONFIRMADO'
  | 'CALIFICADO'
  | 'CANCELADO';

export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';

export type CanceladoPor = 'CLIENTE' | 'TECNICO' | 'SISTEMA';

export type TipoAvance = 'DIAGNOSTICO' | 'AVANCE';

export type EstadoAjuste = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type TipoConstancia = 'RECEPCION' | 'ENTREGA';

export interface ServicioListado {
  readonly id: number;
  readonly solicitudId: number;
  readonly modalidad: Modalidad;
  readonly estado: EstadoServicio;
  readonly montoTotal: number;
  readonly montoFinal: number | null;
  readonly contraparteId: number;
  readonly contraparteNombre: string;
  readonly tipoEquipo: string | null;
  readonly tipoServicio: string | null;
  readonly fechaProgramada: string | null;
  readonly fechaFinalizacion: string | null;
  readonly creadoEn: string;
}

export interface ContactoCliente {
  readonly id: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly celular: string;
  readonly correo: string;
}

export interface ContactoTecnico extends ContactoCliente {
  readonly fotoUrl: string | null;
  readonly calificacionPromedio: number | null;
  readonly totalResenas: number;
  readonly direccionTaller: string | null;
  readonly referenciaTaller: string | null;
  readonly horarioTaller: string | null;
}

export interface SolicitudServicio {
  readonly id: number;
  readonly descripcion: string;
  readonly tipoEquipo: string | null;
  readonly tipoServicio: string | null;
  readonly marca: string | null;
  readonly modelo: string | null;
  readonly urgencia: Urgencia;
  readonly distrito: string | null;
  readonly direccion: string | null;
  readonly referencia: string | null;
  readonly fechaPreferida: string | null;
  readonly horarioPreferido: string | null;
}

export interface HistorialEstado {
  readonly id: number;
  readonly estadoAnterior: EstadoServicio | null;
  readonly estadoNuevo: EstadoServicio;
  readonly cambiadoPorId: number | null;
  readonly cambiadoPorNombre: string | null;
  readonly comentario: string | null;
  readonly creadoEn: string;
}

export interface Constancia {
  readonly id: number;
  readonly tipo: TipoConstancia;
  readonly observaciones: string | null;
  readonly accesorios: string | null;
  readonly confirmadaPorCliente: boolean;
  readonly fechaConfirmacion: string | null;
  readonly creadoEn: string;
  readonly fotoIds: readonly number[];
}

export interface Avance {
  readonly id: number;
  readonly tipo: TipoAvance;
  readonly descripcion: string;
  readonly tieneFoto: boolean;
  readonly creadoEn: string;
}

export interface AjustePrecio {
  readonly id: number;
  readonly servicioId: number;
  readonly montoAnterior: number;
  readonly montoNuevo: number;
  readonly justificacion: string;
  readonly tieneEvidencia: boolean;
  readonly estado: EstadoAjuste;
  readonly creadoEn: string;
  readonly fechaRespuesta: string | null;
}

export interface ServicioDetalle {
  readonly id: number;
  readonly solicitudId: number;
  readonly ofertaId: number;
  readonly modalidad: Modalidad;
  readonly estado: EstadoServicio;
  readonly precioServicio: number;
  readonly costoMovilidad: number;
  readonly costoDiagnostico: number;
  readonly montoTotal: number;
  readonly montoFinal: number | null;
  readonly metodoPago: MetodoPago | null;
  readonly pinInicio: string | null;
  readonly pinValidado: boolean;
  readonly garantiaDias: number;
  readonly fechaProgramada: string | null;
  readonly fechaInicio: string | null;
  readonly fechaFinalizacion: string | null;
  readonly fechaLimiteConformidad: string | null;
  readonly fechaConfirmacion: string | null;
  readonly confirmadoAutomaticamente: boolean;
  readonly canceladoPor: CanceladoPor | null;
  readonly motivoCancelacion: string | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  readonly cliente: ContactoCliente;
  readonly tecnico: ContactoTecnico;
  readonly solicitud: SolicitudServicio;
  readonly historial: readonly HistorialEstado[];
  readonly constancias: readonly Constancia[];
  readonly avances: readonly Avance[];
  readonly ajustes: readonly AjustePrecio[];
  readonly ajustePendiente: AjustePrecio | null;
}

export interface Mensaje {
  readonly id: number;
  readonly emisorId: number;
  readonly emisorNombre: string;
  readonly contenido: string;
  readonly leido: boolean;
  readonly mio: boolean;
  readonly creadoEn: string;
}

export interface CambioEstadoServicioRequest {
  readonly estado: EstadoServicio;
  readonly pin: string | null;
  readonly comentario: string | null;
  readonly motivo: string | null;
}

export interface FinalizarServicioRequest {
  readonly montoFinal: number;
  readonly metodoPago: MetodoPago;
}

export interface AvanceRequest {
  readonly tipo: TipoAvance;
  readonly descripcion: string;
}

export interface AjustePrecioRequest {
  readonly montoNuevo: number;
  readonly justificacion: string;
}

export interface RespuestaAjusteRequest {
  readonly estado: Exclude<EstadoAjuste, 'PENDIENTE'>;
}
