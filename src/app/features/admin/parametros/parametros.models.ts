export type ClaveParametro =
  | 'comision_porcentaje'
  | 'limite_deuda_comision'
  | 'plazo_pago_comision_dias'
  | 'vencimiento_solicitud_horas'
  | 'confirmacion_automatica_horas'
  | 'max_rondas_contraoferta'
  | 'garantia_minima_dias'
  | 'max_imagenes_solicitud'
  | 'dias_para_resenar'
  | 'max_cancelaciones_tecnico_30d'
  | 'calificacion_minima_revision'
  | 'min_resenas_revision'
  | 'tope_movilidad_defecto';

export type TipoValorParametro = 'entero' | 'decimal';

export type GrupoParametro = 'comisiones' | 'solicitudes' | 'calidad';

export interface GrupoParametros {
  readonly id: GrupoParametro;
  readonly etiqueta: string;
  readonly descripcion: string;
  readonly icono: string;
}

export interface DefinicionParametro {
  readonly clave: ClaveParametro;
  readonly grupo: GrupoParametro;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly tipo: TipoValorParametro;
  readonly minimo: number;
  readonly maximo: number;
  readonly decimales: number;
  readonly unidad: string | null;
}

export interface ParametroSistema {
  readonly clave: string;
  readonly valor: string;
  readonly descripcion: string;
  readonly actualizadoEn: string;
  readonly actualizadoPorId: number | null;
}

export interface ParametroActualizacionRequest {
  readonly clave: ClaveParametro;
  readonly valor: string;
}

export interface ParametrosUpdateRequest {
  readonly parametros: readonly ParametroActualizacionRequest[];
}

export const GRUPOS_PARAMETRO: readonly GrupoParametros[] = [
  {
    id: 'comisiones',
    etiqueta: 'Comisiones y pagos',
    descripcion: 'Reglas de cobro, deuda y plazos de pago a los técnicos.',
    icono: 'payments',
  },
  {
    id: 'solicitudes',
    etiqueta: 'Solicitudes y servicios',
    descripcion: 'Tiempos, límites y condiciones que afectan a cada solicitud.',
    icono: 'assignment',
  },
  {
    id: 'calidad',
    etiqueta: 'Reseñas y calidad',
    descripcion: 'Criterios para reseñar servicios y revisar el desempeño técnico.',
    icono: 'reviews',
  },
];

export const DEFINICIONES_PARAMETRO: readonly DefinicionParametro[] = [
  {
    clave: 'comision_porcentaje',
    grupo: 'comisiones',
    etiqueta: 'Comisión de FIXTECH',
    ayuda: 'Fracción entre 0.0001 y 1.0000. Por ejemplo, 0.0600 equivale a 6 %.',
    tipo: 'decimal',
    minimo: 0.0001,
    maximo: 1,
    decimales: 4,
    unidad: null,
  },
  {
    clave: 'limite_deuda_comision',
    grupo: 'comisiones',
    etiqueta: 'Límite de deuda por comisiones',
    ayuda: 'Deuda máxima antes de bloquear al técnico. Se expresa en soles.',
    tipo: 'decimal',
    minimo: 0,
    maximo: 1_000_000,
    decimales: 2,
    unidad: 'S/',
  },
  {
    clave: 'plazo_pago_comision_dias',
    grupo: 'comisiones',
    etiqueta: 'Plazo de pago de comisiones',
    ayuda: 'Días para pagar la comisión desde el cierre del servicio.',
    tipo: 'entero',
    minimo: 1,
    maximo: 365,
    decimales: 0,
    unidad: 'días',
  },
  {
    clave: 'vencimiento_solicitud_horas',
    grupo: 'solicitudes',
    etiqueta: 'Vencimiento de solicitudes',
    ayuda: 'Horas para vencer una solicitud sin una oferta aceptada.',
    tipo: 'entero',
    minimo: 1,
    maximo: 720,
    decimales: 0,
    unidad: 'horas',
  },
  {
    clave: 'confirmacion_automatica_horas',
    grupo: 'solicitudes',
    etiqueta: 'Confirmación automática',
    ayuda: 'Horas para confirmar automáticamente un servicio finalizado.',
    tipo: 'entero',
    minimo: 1,
    maximo: 720,
    decimales: 0,
    unidad: 'horas',
  },
  {
    clave: 'max_rondas_contraoferta',
    grupo: 'solicitudes',
    etiqueta: 'Rondas de contraoferta',
    ayuda: 'Rondas máximas de contraoferta permitidas por oferta.',
    tipo: 'entero',
    minimo: 1,
    maximo: 20,
    decimales: 0,
    unidad: 'rondas',
  },
  {
    clave: 'garantia_minima_dias',
    grupo: 'solicitudes',
    etiqueta: 'Garantía mínima',
    ayuda: 'Garantía mínima sugerida para los servicios, en días.',
    tipo: 'entero',
    minimo: 0,
    maximo: 3650,
    decimales: 0,
    unidad: 'días',
  },
  {
    clave: 'max_imagenes_solicitud',
    grupo: 'solicitudes',
    etiqueta: 'Imágenes por solicitud',
    ayuda: 'Cantidad máxima de fotos que puede adjuntar una solicitud.',
    tipo: 'entero',
    minimo: 1,
    maximo: 5,
    decimales: 0,
    unidad: 'fotos',
  },
  {
    clave: 'dias_para_resenar',
    grupo: 'calidad',
    etiqueta: 'Plazo para reseñar',
    ayuda: 'Días disponibles para dejar una reseña tras confirmar el servicio.',
    tipo: 'entero',
    minimo: 1,
    maximo: 3650,
    decimales: 0,
    unidad: 'días',
  },
  {
    clave: 'max_cancelaciones_tecnico_30d',
    grupo: 'calidad',
    etiqueta: 'Cancelaciones en 30 días',
    ayuda: 'Cancelaciones permitidas al técnico en 30 días antes de revisión.',
    tipo: 'entero',
    minimo: 0,
    maximo: 1000,
    decimales: 0,
    unidad: 'cancelaciones',
  },
  {
    clave: 'calificacion_minima_revision',
    grupo: 'calidad',
    etiqueta: 'Calificación mínima para revisión',
    ayuda: 'Promedio por debajo del cual se revisa al técnico. Escala de 0 a 5.',
    tipo: 'decimal',
    minimo: 0,
    maximo: 5,
    decimales: 2,
    unidad: 'estrellas',
  },
  {
    clave: 'min_resenas_revision',
    grupo: 'calidad',
    etiqueta: 'Reseñas mínimas para revisión',
    ayuda: 'Reseñas necesarias para aplicar la revisión por promedio.',
    tipo: 'entero',
    minimo: 0,
    maximo: 100_000,
    decimales: 0,
    unidad: 'reseñas',
  },
  {
    clave: 'tope_movilidad_defecto',
    grupo: 'solicitudes',
    etiqueta: 'Tope de movilidad por defecto',
    ayuda: 'Tope de movilidad sugerido para nuevos distritos. Se expresa en soles.',
    tipo: 'decimal',
    minimo: 0,
    maximo: 1_000_000,
    decimales: 2,
    unidad: 'S/',
  },
];

export const CLAVES_PARAMETRO: readonly ClaveParametro[] = DEFINICIONES_PARAMETRO.map(
  (definicion) => definicion.clave,
);

export function definicionParametro(clave: string): DefinicionParametro | null {
  return DEFINICIONES_PARAMETRO.find((definicion) => definicion.clave === clave) ?? null;
}

export function errorValorParametro(definicion: DefinicionParametro, valor: string): string | null {
  const texto = valor.trim();
  if (texto === '') {
    return 'El valor es obligatorio.';
  }

  if (definicion.tipo === 'entero') {
    if (!/^\d+$/.test(texto)) {
      return 'Debe ser un número entero.';
    }
    const numero = Number(texto);
    if (!Number.isSafeInteger(numero) || numero < definicion.minimo || numero > definicion.maximo) {
      return `Debe estar entre ${formatearNumero(definicion.minimo)} y ${formatearNumero(
        definicion.maximo,
      )}.`;
    }
    return null;
  }

  if (!/^\d+(?:\.\d+)?$/.test(texto)) {
    return 'Debe ser un número decimal, usando punto como separador.';
  }
  const decimales = texto.includes('.') ? texto.split('.')[1].length : 0;
  if (decimales > definicion.decimales) {
    return `Puede tener como máximo ${definicion.decimales} decimales.`;
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero < definicion.minimo || numero > definicion.maximo) {
    return `Debe estar entre ${formatearNumero(definicion.minimo)} y ${formatearNumero(
      definicion.maximo,
    )}.`;
  }
  return null;
}

export function normalizarValorParametro(valor: string): string {
  return valor.trim();
}

function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 }).format(valor);
}
