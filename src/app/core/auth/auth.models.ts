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

export interface RegistroClienteRequest {
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly celular: string;
  readonly dni: string | null;
  readonly password: string;
  readonly aceptoTerminos: boolean;
}

export interface UsuarioRegistradoResponse {
  readonly id: number;
  readonly correo: string;
  readonly rol: Rol;
}

export interface PerfilTecnico {
  readonly id: number;
  readonly estadoVerificacion: EstadoVerificacion;
  readonly motivoVerificacion: string | null;
  readonly bloqueadoPorDeuda: boolean;
  readonly saldoComisionPendiente: number;
  readonly modalidades: readonly Modalidad[];
  readonly descripcion: string | null;
  readonly aniosExperiencia: number;
  readonly calificacionPromedio: number;
  readonly totalResenas: number;
  readonly serviciosCompletados: number;
  readonly destacado: boolean;
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
