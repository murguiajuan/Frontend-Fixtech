import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  readonly estado: number;
  readonly mensaje: string;
  readonly detalles: readonly string[];
}

interface CuerpoError {
  readonly mensaje?: unknown;
  readonly detalles?: unknown;
}

export function normalizarError(error: unknown): ApiError {
  if (esApiError(error)) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        estado: 0,
        mensaje: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
        detalles: [],
      };
    }
    const cuerpo = leerCuerpo(error);
    return {
      estado: error.status,
      mensaje: cuerpo.mensaje ?? mensajePorEstado(error.status),
      detalles: cuerpo.detalles,
    };
  }
  return {
    estado: 0,
    mensaje: 'Ocurrió un error inesperado. Intente nuevamente.',
    detalles: [],
  };
}

export function esApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidato = error as Partial<ApiError>;
  return (
    typeof candidato.estado === 'number' &&
    typeof candidato.mensaje === 'string' &&
    Array.isArray(candidato.detalles)
  );
}

function leerCuerpo(error: HttpErrorResponse): {
  mensaje: string | null;
  detalles: string[];
} {
  const cuerpo = error.error;
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return { mensaje: null, detalles: [] };
  }
  const { mensaje, detalles } = cuerpo as CuerpoError;
  return {
    mensaje: typeof mensaje === 'string' && mensaje.trim() !== '' ? mensaje : null,
    detalles: Array.isArray(detalles)
      ? detalles.filter((detalle): detalle is string => typeof detalle === 'string')
      : [],
  };
}

function mensajePorEstado(estado: number): string {
  switch (estado) {
    case 400:
      return 'Los datos enviados no son válidos. Revise el formulario.';
    case 401:
      return 'Su sesión expiró. Inicie sesión nuevamente.';
    case 403:
      return 'No tiene permisos para realizar esta operación.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 409:
      return 'La operación entra en conflicto con el estado actual.';
    case 422:
      return 'Los datos enviados no se pudieron procesar.';
    case 429:
      return 'Demasiados intentos. Espere un momento e intente nuevamente.';
    default:
      return estado >= 500
        ? 'El servidor no pudo completar la operación. Intente más tarde.'
        : 'No se pudo completar la operación.';
  }
}
