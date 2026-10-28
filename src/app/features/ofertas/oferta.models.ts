import { Modalidad } from '../../core/auth/auth.models';
import { EstadoServicio } from '../servicios/servicio.models';

export type ModalidadOferta = Exclude<Modalidad, 'INDISTINTO'>;

export type EstadoOferta =
  'ENVIADA' | 'CONTRAOFERTADA' | 'ACEPTADA' | 'RECHAZADA' | 'RETIRADA' | 'EXPIRADA';

export type OfertaOrden = 'PRECIO' | 'CALIFICACION' | 'TIEMPO';

export type AccionContraoferta = 'CONTRAOFERTA' | 'ACEPTAR' | 'RECHAZAR';

export type EmisorContraoferta = 'CLIENTE' | 'TECNICO';

export type EstadoContraoferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'SUPERADA';

export interface OfertaRequest {
  readonly modalidad: ModalidadOferta;
  readonly precioServicio: number;
  readonly costoMovilidad: number;
  readonly costoDiagnostico: number;
  readonly tiempoEstimadoHoras: number;
  readonly garantiaDias: number | null;
  readonly mensaje: string | null;
}

export interface ContraofertaRequest {
  readonly accion: AccionContraoferta;
  readonly montoPropuesto: number | null;
  readonly mensaje: string | null;
}

export interface Contraoferta {
  readonly id: number;
  readonly emisor: EmisorContraoferta;
  readonly ronda: number;
  readonly montoPropuesto: number;
  readonly mensaje: string | null;
  readonly estado: EstadoContraoferta;
  readonly creadoEn: string;
}

export interface TecnicoOfertaResumen {
  readonly id: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly fotoUrl: string | null;
  readonly descripcion: string | null;
  readonly aniosExperiencia: number;
  readonly calificacionPromedio: number | null;
  readonly totalResenas: number;
  readonly serviciosCompletados: number;
  readonly destacado: boolean;
}

export interface Oferta {
  readonly id: number;
  readonly solicitudId: number;
  readonly estado: EstadoOferta;
  readonly modalidad: ModalidadOferta;
  readonly precioServicio: number;
  readonly costoMovilidad: number;
  readonly costoDiagnostico: number;
  readonly precioTotal: number;
  readonly tiempoEstimadoHoras: number;
  readonly garantiaDias: number;
  readonly mensaje: string | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
  readonly tecnico: TecnicoOfertaResumen;
  readonly contraofertas: readonly Contraoferta[];
  readonly servicioId: number | null;
}

export interface ServicioResumen {
  readonly id: number;
  readonly solicitudId: number;
  readonly ofertaId: number;
  readonly clienteId: number;
  readonly tecnicoId: number;
  readonly modalidad: Modalidad;
  readonly estado: EstadoServicio;
  readonly precioServicio: number;
  readonly costoMovilidad: number;
  readonly costoDiagnostico: number;
  readonly montoTotal: number;
  readonly montoFinal: number | null;
  readonly garantiaDias: number;
  readonly creadoEn: string;
}

export interface RespuestaNegociacion {
  readonly oferta: Oferta;
  readonly servicio: ServicioResumen | null;
}

export interface SolicitudDisponible {
  readonly id: number;
  readonly estado: 'PUBLICADA' | 'CON_OFERTAS';
  readonly urgencia: 'BAJA' | 'MEDIA' | 'ALTA';
  readonly modalidad: Modalidad;
  readonly tipoEquipo: string;
  readonly tipoServicio: string;
  readonly distritoId: number;
  readonly distrito: string;
  readonly marca: string | null;
  readonly modelo: string | null;
  readonly descripcion: string;
  readonly fechaPreferida: string | null;
  readonly horarioPreferido: string | null;
  readonly presupuestoReferencial: number | null;
  readonly fechaVencimiento: string;
  readonly creadoEn: string;
  readonly imagenes: readonly ImagenSolicitudDisponible[];
}

export interface ImagenSolicitudDisponible {
  readonly id: number;
  readonly orden: number;
  readonly url: string;
}
