import type { CatalogoSimple } from '../catalogos/catalogo.models';

export type Rol = 'CLIENTE' | 'TECNICO' | 'ADMIN';
export type EstadoUsuario = 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
export type EstadoVerificacion = 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';
export type Modalidad = 'DOMICILIO' | 'TALLER' | 'INDISTINTO';

export interface LoginRequest {
  readonly correo: string;
  readonly password: string;
}

export interface TokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly expiraEnSegundos: number;
}

export interface SolicitudRecuperacionRequest {
  readonly correo: string;
}

export interface VerificacionRecuperacionRequest {
  readonly correo: string;
  readonly codigo: string;
}

export interface RestablecerPasswordRequest {
  readonly ticket: string;
  readonly password: string;
}

export interface AccesoRecuperacionRequest {
  readonly ticket: string;
}

export interface RecuperacionVerificadaResponse {
  readonly ticket: string;
  readonly expiraEnSegundos: number;
}

export interface MensajeGenericoResponse {
  readonly mensaje: string;
}

export interface RegistroClienteRequest {
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly celular: string;
  readonly dni: string | null;
  readonly password: string;
  readonly aceptoTerminos: boolean;
}

export interface RegistroTecnicoRequest {
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly celular: string;
  readonly dni: string;
  readonly password: string;
  readonly aceptoTerminos: boolean;
  readonly descripcion: string | null;
  readonly aniosExperiencia: number;
  readonly ofreceDomicilio: boolean;
  readonly ofreceTaller: boolean;
  readonly direccionTaller: string | null;
  readonly referenciaTaller: string | null;
  readonly horarioTaller: string | null;
  readonly especialidadIds: readonly number[];
  readonly distritoIds: readonly number[];
}

export interface UsuarioRegistradoResponse {
  readonly id: number;
  readonly correo: string;
  readonly rol: Rol;
}

export interface PerfilTecnico {
  readonly id: number;
  readonly dni: string;
  readonly celular: string;
  readonly estadoVerificacion: EstadoVerificacion;
  readonly motivoVerificacion: string | null;
  readonly bloqueadoPorDeuda: boolean;
  readonly saldoComisionPendiente: number;
  readonly modalidades: readonly Modalidad[];
  readonly ofreceDomicilio: boolean;
  readonly ofreceTaller: boolean;
  readonly especialidades: readonly CatalogoSimple[];
  readonly distritos: readonly CatalogoSimple[];
  readonly descripcion: string | null;
  readonly aniosExperiencia: number;
  readonly direccionTaller: string | null;
  readonly referenciaTaller: string | null;
  readonly horarioTaller: string | null;
  readonly garantiaDiasDefecto: number;
  readonly calificacionPromedio: number;
  readonly totalResenas: number;
  readonly serviciosCompletados: number;
  readonly destacado: boolean;
}

export interface PerfilTecnicoRequest {
  readonly nombres: string;
  readonly apellidos: string;
  readonly dni: string;
  readonly celular: string;
  readonly descripcion: string | null;
  readonly aniosExperiencia: number;
  readonly ofreceDomicilio: boolean;
  readonly ofreceTaller: boolean;
  readonly direccionTaller: string | null;
  readonly referenciaTaller: string | null;
  readonly horarioTaller: string | null;
  readonly garantiaDiasDefecto: number;
  readonly especialidadIds: readonly number[];
  readonly distritoIds: readonly number[];
}

export interface PerfilUsuario {
  readonly id: number;
  readonly correo: string;
  readonly rol: Rol;
  readonly estado: EstadoUsuario;
  readonly nombres: string;
  readonly apellidos: string;
  readonly fotoUrl: string | null;
  readonly tecnico: PerfilTecnico | null;
}
