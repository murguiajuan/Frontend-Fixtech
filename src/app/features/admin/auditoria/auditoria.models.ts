export interface FiltrosAuditoria {
  readonly usuarioId: number | null;
  readonly entidad: string;
  readonly accion: string;
  readonly desde: string;
  readonly hasta: string;
  readonly pagina: number;
  readonly tamano: number;
}

export interface Auditoria {
  readonly id: number;
  readonly usuarioId: number | null;
  readonly accion: string;
  readonly entidad: string;
  readonly entidadId: number | null;
  readonly detalle: string | null;
  readonly ip: string | null;
  readonly creadoEn: string;
}

export interface PaginaAuditoria {
  readonly contenido: readonly Auditoria[];
  readonly pagina: number;
  readonly tamano: number;
  readonly totalElementos: number;
  readonly totalPaginas: number;
}

export const TAMANOS_PAGINA_AUDITORIA = [10, 20, 50, 100] as const;

export type TamanoPaginaAuditoria = (typeof TAMANOS_PAGINA_AUDITORIA)[number];
