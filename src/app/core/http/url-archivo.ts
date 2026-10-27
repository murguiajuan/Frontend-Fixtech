import { environment } from '../../../environments/environment';

const ORIGEN_API = environment.apiUrl.replace(/\/api\/?$/, '');

/**
 * Convierte una ruta de archivo entregada por la API (por ejemplo
 * `/api/solicitudes/1/imagenes/2`) en una URL absoluta para descargarla.
 */
export function resolverUrlArchivo(ruta: string): string {
  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }
  return `${ORIGEN_API}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
}
