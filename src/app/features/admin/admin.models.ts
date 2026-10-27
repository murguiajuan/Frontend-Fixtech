import { EstadoUsuario, EstadoVerificacion, Modalidad, Rol } from '../../core/auth/auth.models';

export const FILTRO_TODOS = 'TODOS' as const;

export type FiltroEstadoVerificacion = EstadoVerificacion | typeof FILTRO_TODOS;
export type FiltroEstadoUsuario = EstadoUsuario | typeof FILTRO_TODOS;
export type FiltroRol = Rol | typeof FILTRO_TODOS;

export type EstadoVerificacionAccion = Exclude<EstadoVerificacion, 'PENDIENTE'>;
export type EstadoAccionUsuario = Extract<EstadoUsuario, 'ACTIVO' | 'SUSPENDIDO'>;

export const ESTADOS_VERIFICACION: readonly EstadoVerificacion[] = [
  'PENDIENTE',
  'APROBADO',
  'OBSERVADO',
  'RECHAZADO',
];

export const ESTADOS_VERIFICACION_ACCION: readonly EstadoVerificacionAccion[] = [
  'APROBADO',
  'OBSERVADO',
  'RECHAZADO',
];

export const ESTADOS_USUARIO: readonly EstadoUsuario[] = ['ACTIVO', 'SUSPENDIDO', 'INACTIVO'];
export const ROLES: readonly Rol[] = ['CLIENTE', 'TECNICO', 'ADMIN'];

export interface FiltrosTecnicos {
  readonly estadoVerificacion: FiltroEstadoVerificacion;
  readonly busqueda: string;
}

export interface FiltrosUsuarios {
  readonly rol: FiltroRol;
  readonly estado: FiltroEstadoUsuario;
  readonly busqueda: string;
}

export interface TecnicoAdmin {
  readonly id: number;
  readonly usuarioId: number;
  readonly correo: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly dni: string;
  readonly celular: string;
  readonly fotoUrl: string | null;
  readonly estadoVerificacion: EstadoVerificacion;
  readonly motivoVerificacion: string | null;
  readonly bloqueadoPorDeuda: boolean;
  readonly saldoComisionPendiente: number;
  readonly modalidades: readonly Modalidad[];
  readonly calificacionPromedio: number;
  readonly totalResenas: number;
  readonly serviciosCompletados: number;
  readonly destacado: boolean;
  readonly fechaVerificacion: string | null;
  readonly creadoEn: string;
}

export interface UsuarioAdmin {
  readonly id: number;
  readonly correo: string;
  readonly rol: Rol;
  readonly estado: EstadoUsuario;
  readonly motivoSuspension: string | null;
  readonly nombres: string | null;
  readonly apellidos: string | null;
  readonly creadoEn: string;
}

export interface VerificacionTecnicoRequest {
  readonly estado: EstadoVerificacionAccion;
  readonly motivo: string | null;
}

export interface TecnicoVerificacionResponse {
  readonly id: number;
  readonly estadoVerificacion: EstadoVerificacion;
  readonly motivoVerificacion: string | null;
  readonly fechaVerificacion: string | null;
}

export interface CambioEstadoUsuarioRequest {
  readonly estado: EstadoAccionUsuario;
  readonly motivo: string | null;
}

export function nombreVisible(
  nombres: string | null,
  apellidos: string | null,
  correo: string,
): string {
  const completo = `${nombres ?? ''} ${apellidos ?? ''}`.trim();
  return completo === '' ? correo : completo;
}

export function iniciales(
  nombres: string | null,
  apellidos: string | null,
  correo: string,
): string {
  const nombre = nombres?.trim() ?? '';
  const apellido = apellidos?.trim() ?? '';
  if (nombre !== '' && apellido !== '') {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }
  if (nombre !== '') {
    return nombre.slice(0, 2).toUpperCase();
  }
  return correo.slice(0, 2).toUpperCase();
}

export function estadoAccionUsuario(usuario: UsuarioAdmin): EstadoAccionUsuario {
  return usuario.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
}
