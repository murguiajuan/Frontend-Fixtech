export type TipoNotificacion =
  | 'OFERTA_RECIBIDA'
  | 'OFERTA_ACTUALIZADA'
  | 'OFERTA_RETIRADA'
  | 'CONTRAOFERTA_RECIBIDA'
  | 'OFERTA_ACEPTADA'
  | 'OFERTA_RECHAZADA'
  | 'VERIFICACION_TECNICO'
  | 'SERVICIO_EN_CAMINO'
  | 'SERVICIO_INICIADO'
  | 'EQUIPO_RECIBIDO'
  | 'CONSTANCIA_REGISTRADA'
  | 'CONSTANCIA_CONFIRMADA'
  | 'AVANCE_REGISTRADO'
  | 'AJUSTE_PROPUESTO'
  | 'AJUSTE_APROBADO'
  | 'AJUSTE_RECHAZADO'
  | 'SERVICIO_FINALIZADO'
  | 'SERVICIO_CONFIRMADO'
  | 'SERVICIO_LISTO'
  | 'SERVICIO_CANCELADO'
  | 'MENSAJE_NUEVO'
  | 'COMISION_GENERADA'
  | 'PAGO_COMISION_REGISTRADO'
  | 'PAGO_COMISION_VALIDADO'
  | 'PAGO_COMISION_RECHAZADO'
  | 'BLOQUEO_DEUDA'
  | 'DESBLOQUEO_DEUDA'
  | 'RESENA_REGISTRADA'
  | 'RESENA_RESPUESTA'
  | 'RESENA_REPORTADA'
  | 'RESENA_MODERADA'
  | 'RECLAMO_REGISTRADO'
  | 'RECLAMO_EN_REVISION'
  | 'RECLAMO_RESPUESTA'
  | 'RECLAMO_RESUELTO'
  | 'RECLAMO_CERRADO'
  | 'USUARIO_SUSPENDIDO'
  | 'USUARIO_REACTIVADO';

export interface Notificacion {
  readonly id: number;
  readonly tipo: TipoNotificacion;
  readonly titulo: string;
  readonly mensaje: string;
  readonly referenciaTipo: string | null;
  readonly referenciaId: number | null;
  readonly leida: boolean;
  readonly creadoEn: string;
}

export interface NotificacionesResponse {
  readonly notificaciones: readonly Notificacion[];
  readonly noLeidas: number;
}

const ETIQUETAS_REFERENCIA: Readonly<Record<string, string>> = {
  PAGO_COMISION: 'Pago de comisión',
  RESENA: 'Reseña',
  RECLAMO: 'Reclamo',
  SERVICIO: 'Servicio',
  OFERTA: 'Oferta',
  TECNICO: 'Técnico',
};

export function iconoNotificacion(tipo: TipoNotificacion): string {
  if (tipo.includes('OFERTA')) {
    return 'request_quote';
  }
  if (
    tipo.startsWith('SERVICIO') ||
    tipo.startsWith('CONSTANCIA') ||
    tipo.startsWith('AJUSTE') ||
    tipo === 'EQUIPO_RECIBIDO' ||
    tipo === 'AVANCE_REGISTRADO'
  ) {
    return 'build_circle';
  }
  if (
    tipo.startsWith('COMISION') ||
    tipo.startsWith('PAGO_COMISION') ||
    tipo.startsWith('BLOQUEO') ||
    tipo.startsWith('DESBLOQUEO')
  ) {
    return 'payments';
  }
  if (tipo.startsWith('RESENA')) {
    return 'reviews';
  }
  if (tipo.startsWith('RECLAMO')) {
    return 'support_agent';
  }
  if (tipo === 'VERIFICACION_TECNICO') {
    return 'verified_user';
  }
  if (tipo.startsWith('USUARIO')) {
    return 'manage_accounts';
  }
  if (tipo === 'MENSAJE_NUEVO') {
    return 'chat';
  }
  return 'notifications';
}

export function etiquetaReferencia(referenciaTipo: string | null): string | null {
  if (referenciaTipo === null || referenciaTipo.trim() === '') {
    return null;
  }
  const etiqueta = ETIQUETAS_REFERENCIA[referenciaTipo];
  if (etiqueta !== undefined) {
    return etiqueta;
  }
  const texto = referenciaTipo.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
