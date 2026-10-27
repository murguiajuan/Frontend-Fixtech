import { EstadoUsuario, EstadoVerificacion, Modalidad, Rol } from '../auth/auth.models';

export type TonoBadge = 'neutral' | 'ok' | 'alerta' | 'error' | 'info';

export const ETIQUETAS_ROL: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};

export const ETIQUETAS_ESTADO_VERIFICACION: Record<EstadoVerificacion, string> = {
  PENDIENTE: 'En revisión',
  APROBADO: 'Aprobado',
  OBSERVADO: 'Observado',
  RECHAZADO: 'Rechazado',
};

export const TONOS_ESTADO_VERIFICACION: Record<EstadoVerificacion, TonoBadge> = {
  PENDIENTE: 'alerta',
  APROBADO: 'ok',
  OBSERVADO: 'alerta',
  RECHAZADO: 'error',
};

export const ETIQUETAS_ESTADO_USUARIO: Record<EstadoUsuario, string> = {
  ACTIVO: 'Activo',
  SUSPENDIDO: 'Suspendido',
  INACTIVO: 'Inactivo',
};

export const TONOS_ESTADO_USUARIO: Record<EstadoUsuario, TonoBadge> = {
  ACTIVO: 'ok',
  SUSPENDIDO: 'error',
  INACTIVO: 'neutral',
};

export const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = {
  DOMICILIO: 'A domicilio',
  TALLER: 'En taller',
  INDISTINTO: 'Indistinto',
};
