export interface EspecialidadCatalogo {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly activo: boolean;
}

export interface DistritoCatalogo {
  readonly id: number;
  readonly nombre: string;
  readonly provincia: string;
  readonly topeMovilidad: number;
  readonly activo: boolean;
}
