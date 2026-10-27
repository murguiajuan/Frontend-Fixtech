import { EstadoVerificacion, Modalidad, Rol } from '../auth/auth.models';

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

export const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = {
  DOMICILIO: 'A domicilio',
  TALLER: 'En taller',
  INDISTINTO: 'Indistinto',
};
