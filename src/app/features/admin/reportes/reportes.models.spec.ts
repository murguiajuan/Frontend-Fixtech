import { etiquetaMes, validarFiltrosReporte } from './reportes.models';

describe('modelo de reportes', () => {
  it('exige ambas fechas y un rango válido', () => {
    expect(validarFiltrosReporte('', '2026-10-27')).toBe(
      'Debe indicar la fecha de inicio y de fin.',
    );
    expect(validarFiltrosReporte('2026-02-30', '2026-03-01')).toBe(
      'Las fechas indicadas no son válidas.',
    );
    expect(validarFiltrosReporte('2026-10-28', '2026-10-27')).toBe(
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
    expect(validarFiltrosReporte('2026-10-01', '2026-10-27')).toBeNull();
  });

  it('limita el periodo igual que el backend: 366 días de diferencia', () => {
    expect(validarFiltrosReporte('2025-01-01', '2025-12-31')).toBeNull();
    expect(validarFiltrosReporte('2024-01-01', '2024-12-31')).toBeNull();
    expect(validarFiltrosReporte('2024-01-01', '2025-01-01')).toContain(
      'El periodo no puede superar los 366 días.',
    );
  });

  it('formatea los meses devueltos por la API', () => {
    expect(etiquetaMes('2026-10')).toBe('oct 2026');
    expect(etiquetaMes('2026-01')).toBe('ene 2026');
    expect(etiquetaMes('formato-raro')).toBe('formato-raro');
    expect(etiquetaMes('2026-15')).toBe('2026-15');
  });
});
