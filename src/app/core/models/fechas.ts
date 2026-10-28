export interface RangoFechas {
  readonly desde: string;
  readonly hasta: string;
}

const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function fechaIsoLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function hoyIso(): string {
  return fechaIsoLocal(new Date());
}

export function rangoMesActual(hoy = new Date()): RangoFechas {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: fechaIsoLocal(inicio), hasta: fechaIsoLocal(hoy) };
}

export function esFechaValida(valor: string): boolean {
  if (!FORMATO_FECHA_ISO.test(valor)) {
    return false;
  }
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}

/**
 * Devuelve la diferencia en días entre dos fechas ISO o `null` cuando alguna
 * de las fechas no es válida. El cálculo usa UTC para evitar cambios por zona
 * horaria.
 */
export function diferenciaDias(desde: string, hasta: string): number | null {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return null;
  }
  const [anioDesde, mesDesde, diaDesde] = desde.split('-').map(Number);
  const [anioHasta, mesHasta, diaHasta] = hasta.split('-').map(Number);
  const inicio = Date.UTC(anioDesde, mesDesde - 1, diaDesde);
  const fin = Date.UTC(anioHasta, mesHasta - 1, diaHasta);
  return Math.round((fin - inicio) / 86_400_000);
}

export function validarRangoFechas(desde: string, hasta: string): string | null {
  if (desde === '' || hasta === '') {
    return 'Debe indicar la fecha de inicio y de fin.';
  }
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return 'Las fechas indicadas no son válidas.';
  }
  return validarRangoFechasOpcional(desde, hasta);
}

/**
 * Valida un rango donde cada extremo es opcional. Se usa en filtros que el
 * backend acepta de forma independiente, como la auditoría.
 */
export function validarRangoFechasOpcional(desde: string, hasta: string): string | null {
  if (desde !== '' && !esFechaValida(desde)) {
    return 'La fecha de inicio no es válida.';
  }
  if (hasta !== '' && !esFechaValida(hasta)) {
    return 'La fecha de fin no es válida.';
  }
  if (desde !== '' && hasta !== '' && hasta < desde) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }
  return null;
}
