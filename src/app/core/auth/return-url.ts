const RUTA_INICIO = '/app/inicio';

/**
 * Normaliza el parámetro `returnUrl` para impedir redirecciones abiertas.
 *
 * Solo se aceptan rutas internas bajo `/app` (con o sin query string y hash).
 * Cualquier valor absoluto, protocolo-relativo, con origen distinto o con
 * segmentos de navegación relativa (`..`) se descarta y se usa `/app/inicio`.
 */
export function urlRetornoSegura(returnUrl: string | null): string {
  if (returnUrl === null || returnUrl.trim().length === 0) {
    return RUTA_INICIO;
  }

  if (!returnUrl.startsWith('/app')) {
    return RUTA_INICIO;
  }

  let destino: URL;
  try {
    destino = new URL(returnUrl, 'http://fixtech.local');
  } catch {
    return RUTA_INICIO;
  }

  if (destino.origin !== 'http://fixtech.local') {
    return RUTA_INICIO;
  }

  const ruta = destino.pathname;
  if (ruta !== '/app' && !ruta.startsWith('/app/')) {
    return RUTA_INICIO;
  }

  const segmentos = ruta.split('/');
  const tieneSegmentoInseguro = segmentos.some((segmento) => {
    let decodificado: string;
    try {
      decodificado = decodeURIComponent(segmento);
    } catch {
      return true;
    }
    const tieneControl = [...decodificado].some((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < 0x20 || codigo === 0x7f;
    });
    return (
      decodificado === '.' ||
      decodificado === '..' ||
      decodificado.includes('/') ||
      decodificado.includes('\\') ||
      tieneControl
    );
  });
  if (tieneSegmentoInseguro) {
    return RUTA_INICIO;
  }

  if (destino.username !== '' || destino.password !== '') {
    return RUTA_INICIO;
  }

  return `${ruta}${destino.search}${destino.hash}`;
}
