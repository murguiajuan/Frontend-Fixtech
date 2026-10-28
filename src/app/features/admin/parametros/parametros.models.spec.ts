import {
  DEFINICIONES_PARAMETRO,
  definicionParametro,
  errorValorParametro,
} from './parametros.models';

const PARAMETROS = new Map(
  DEFINICIONES_PARAMETRO.map((definicion) => [definicion.clave, definicion]),
);

const COMISION = PARAMETROS.get('comision_porcentaje');
const IMAGENES = PARAMETROS.get('max_imagenes_solicitud');
const LIMITE = PARAMETROS.get('limite_deuda_comision');

describe('modelo de parámetros', () => {
  it('define las trece claves del backend sin duplicados', () => {
    expect(DEFINICIONES_PARAMETRO).toHaveLength(13);
    expect(new Set(DEFINICIONES_PARAMETRO.map((definicion) => definicion.clave)).size).toBe(13);
    expect(definicionParametro('clave_inexistente')).toBeNull();
  });

  it('valida un porcentaje decimal dentro del rango y con su escala', () => {
    expect(COMISION).toBeDefined();
    if (COMISION === undefined) {
      return;
    }
    expect(errorValorParametro(COMISION, '0.0600')).toBeNull();
    expect(errorValorParametro(COMISION, '0.0001')).toBeNull();
    expect(errorValorParametro(COMISION, '1')).toBeNull();
    expect(errorValorParametro(COMISION, '0')).toContain('Debe estar entre');
    expect(errorValorParametro(COMISION, '1.0001')).toContain('Debe estar entre');
    expect(errorValorParametro(COMISION, '0.12345')).toBe('Puede tener como máximo 4 decimales.');
    expect(errorValorParametro(COMISION, 'abc')).toContain('número decimal');
    expect(errorValorParametro(COMISION, '')).toBe('El valor es obligatorio.');
  });

  it('valida enteros, su rango y rechaza decimales', () => {
    expect(IMAGENES).toBeDefined();
    if (IMAGENES === undefined) {
      return;
    }
    expect(errorValorParametro(IMAGENES, '5')).toBeNull();
    expect(errorValorParametro(IMAGENES, '0')).toContain('Debe estar entre 1 y 5');
    expect(errorValorParametro(IMAGENES, '6')).toContain('Debe estar entre 1 y 5');
    expect(errorValorParametro(IMAGENES, '2.5')).toBe('Debe ser un número entero.');
  });

  it('aplica el tope monetario de un millón', () => {
    expect(LIMITE).toBeDefined();
    if (LIMITE === undefined) {
      return;
    }
    expect(errorValorParametro(LIMITE, '1000000.00')).toBeNull();
    expect(errorValorParametro(LIMITE, '1000000.01')).toContain('Debe estar entre');
  });
});
