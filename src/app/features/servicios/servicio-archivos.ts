const BYTES_POR_MB = 1024 * 1024;

export const MAX_IMAGEN_BYTES = 5 * BYTES_POR_MB;
export const TIPOS_IMAGEN_PERMITIDOS: readonly string[] = ['image/jpeg', 'image/png'];

export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
    return `${archivo.name}: solo se permiten imágenes JPG o PNG.`;
  }
  if (archivo.size > MAX_IMAGEN_BYTES) {
    return `${archivo.name}: la imagen supera los 5 MB.`;
  }
  return null;
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < BYTES_POR_MB) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / BYTES_POR_MB).toFixed(1)} MB`;
}
