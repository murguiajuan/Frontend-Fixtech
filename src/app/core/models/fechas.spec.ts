import {
  diferenciaDias,
  esFechaValida,
  fechaIsoLocal,
  rangoMesActual,
  validarRangoFechas,
  validarRangoFechasOpcional,
} from './fechas';

describe('helpers de fechas', () => {
  it('formatea una fecha local como ISO sin desplazar el día', () => {
    expect(fechaIsoLocal(new Date(2026, 0, 9, 23, 30))).toBe('2026-01-09');
  });

  it('calcula el rango del mes actual hasta hoy', () => {
    expect(rangoMesActual(new Date(2026, 9, 27))).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-27',
    });
  });

  it('valida fechas ISO y rechaza días inexistentes', () => {
    expect(esFechaValida('2024-02-29')).toBe(true);
    expect(esFechaValida('2026-02-29')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('27/10/2026')).toBe(false);
    expect(esFechaValida('')).toBe(false);
  });

  it('calcula la diferencia en días usando UTC', () => {
    expect(diferenciaDias('2026-10-01', '2026-10-27')).toBe(26);
    expect(diferenciaDias('2024-01-01', '2024-12-31')).toBe(365);
    expect(diferenciaDias('2026-10-27', '2026-10-01')).toBe(-26);
    expect(diferenciaDias('2026-02-30', '2026-03-01')).toBeNull();
  });

  it('valida un rango obligatorio', () => {
    expect(validarRangoFechas('', '2026-10-27')).toBe('Debe indicar la fecha de inicio y de fin.');
    expect(validarRangoFechas('2026-02-30', '2026-03-01')).toBe(
      'Las fechas indicadas no son válidas.',
    );
    expect(validarRangoFechas('2026-10-28', '2026-10-27')).toBe(
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
    expect(validarRangoFechas('2026-10-01', '2026-10-27')).toBeNull();
  });

  it('valida rangos con extremos opcionales para los filtros de auditoría', () => {
    expect(validarRangoFechasOpcional('', '')).toBeNull();
    expect(validarRangoFechasOpcional('2026-10-01', '')).toBeNull();
    expect(validarRangoFechasOpcional('', '2026-10-27')).toBeNull();
    expect(validarRangoFechasOpcional('2026-02-30', '')).toBe('La fecha de inicio no es válida.');
    expect(validarRangoFechasOpcional('', '2026-02-30')).toBe('La fecha de fin no es válida.');
    expect(validarRangoFechasOpcional('2026-10-28', '2026-10-27')).toBe(
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
    expect(validarRangoFechasOpcional('2026-10-01', '2026-10-27')).toBeNull();
  });
});
