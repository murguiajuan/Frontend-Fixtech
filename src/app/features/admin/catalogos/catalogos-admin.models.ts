export type TipoCatalogoAdmin = 'tipos-equipo' | 'tipos-servicio' | 'especialidades' | 'distritos';

export interface OpcionCatalogoAdmin {
  readonly tipo: TipoCatalogoAdmin;
  readonly etiqueta: string;
  readonly etiquetaSingular: string;
  readonly tituloCrear: string;
  readonly tituloEditar: string;
  readonly icono: string;
  readonly maxNombre: number;
}

export const OPCIONES_CATALOGO_ADMIN: Record<TipoCatalogoAdmin, OpcionCatalogoAdmin> = {
  'tipos-equipo': {
    tipo: 'tipos-equipo',
    etiqueta: 'Tipos de equipo',
    etiquetaSingular: 'tipo de equipo',
    tituloCrear: 'Nuevo tipo de equipo',
    tituloEditar: 'Editar tipo de equipo',
    icono: 'devices',
    maxNombre: 60,
  },
  'tipos-servicio': {
    tipo: 'tipos-servicio',
    etiqueta: 'Tipos de servicio',
    etiquetaSingular: 'tipo de servicio',
    tituloCrear: 'Nuevo tipo de servicio',
    tituloEditar: 'Editar tipo de servicio',
    icono: 'handyman',
    maxNombre: 80,
  },
  especialidades: {
    tipo: 'especialidades',
    etiqueta: 'Especialidades',
    etiquetaSingular: 'especialidad',
    tituloCrear: 'Nueva especialidad',
    tituloEditar: 'Editar especialidad',
    icono: 'workspace_premium',
    maxNombre: 80,
  },
  distritos: {
    tipo: 'distritos',
    etiqueta: 'Distritos',
    etiquetaSingular: 'distrito',
    tituloCrear: 'Nuevo distrito',
    tituloEditar: 'Editar distrito',
    icono: 'location_on',
    maxNombre: 60,
  },
};

export const TIPOS_CATALOGO_ADMIN: readonly TipoCatalogoAdmin[] = [
  'tipos-equipo',
  'tipos-servicio',
  'especialidades',
  'distritos',
];

export interface CatalogoSimpleAdmin {
  readonly id: number;
  readonly nombre: string;
  readonly activo: boolean;
}

export interface EspecialidadAdmin {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly activo: boolean;
}

export interface DistritoAdmin {
  readonly id: number;
  readonly nombre: string;
  readonly provincia: string;
  readonly topeMovilidad: number;
  readonly activo: boolean;
}

export type CatalogoAdmin = CatalogoSimpleAdmin | EspecialidadAdmin | DistritoAdmin;

export interface CatalogoSimpleAdminRequest {
  readonly nombre: string;
}

export interface EspecialidadAdminRequest {
  readonly nombre: string;
  readonly descripcion: string | null;
}

export interface DistritoAdminRequest {
  readonly nombre: string;
  readonly provincia: string;
  readonly topeMovilidad: number;
}

export type CatalogoAdminRequest =
  CatalogoSimpleAdminRequest | EspecialidadAdminRequest | DistritoAdminRequest;

export interface EstadoCatalogoRequest {
  readonly activo: boolean;
}

export const MAX_DESCRIPCION_ESPECIALIDAD = 200;
export const MAX_PROVINCIA_DISTRITO = 60;
export const TOPE_MOVILIDAD_MAXIMO = 1_000_000;

export function esEspecialidadAdmin(item: CatalogoAdmin): item is EspecialidadAdmin {
  return 'descripcion' in item;
}

export function esDistritoAdmin(item: CatalogoAdmin): item is DistritoAdmin {
  return 'provincia' in item;
}
