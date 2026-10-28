import { environment } from '../../../environments/environment';

const BASE_API = new URL(environment.apiUrl);
const RUTA_API = BASE_API.pathname.replace(/\/$/, '');

/**
 * Convierte una ruta de archivo entregada por la API (por ejemplo
 * `/api/solicitudes/1/imagenes/2`) en una URL absoluta para descargarla.
 *
 * Solo se aceptan rutas bajo el mismo origen y el prefijo de la API. Así se
 * evita que un valor manipulado desde el backend haga que el navegador
 * descargue recursos de terceros con las credenciales de la sesión.
 */
export function resolverUrlArchivo(ruta: string): string | null {
  if (ruta.length === 0 || ruta.startsWith('//') || ruta.includes('\\')) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(ruta, BASE_API);
  } catch {
    return null;
  }

  if (url.origin !== BASE_API.origin) {
    return null;
  }

  if (url.pathname !== RUTA_API && !url.pathname.startsWith(`${RUTA_API}/`)) {
    return null;
  }

  return url.toString();
}
