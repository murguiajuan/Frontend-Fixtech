import { descargarArchivo, nombreArchivoDesdeContentDisposition } from './descarga-archivo';

describe('descarga de archivos', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('extrae un nombre entre comillas desde Content-Disposition', () => {
    expect(
      nombreArchivoDesdeContentDisposition('attachment; filename="reporte-octubre.xlsx"'),
    ).toBe('reporte-octubre.xlsx');
  });

  it('extrae un nombre sin comillas desde Content-Disposition', () => {
    expect(nombreArchivoDesdeContentDisposition('attachment; filename=reporte.xlsx')).toBe(
      'reporte.xlsx',
    );
  });

  it('prefiere el nombre extendido y lo decodifica', () => {
    expect(
      nombreArchivoDesdeContentDisposition(
        'attachment; filename="reporte.xlsx"; filename*=UTF-8\'\'reporte%20octubre.xlsx',
      ),
    ).toBe('reporte octubre.xlsx');
  });

  it('devuelve null cuando la cabecera no tiene un nombre utilizable', () => {
    expect(nombreArchivoDesdeContentDisposition(null)).toBeNull();
    expect(nombreArchivoDesdeContentDisposition('')).toBeNull();
    expect(nombreArchivoDesdeContentDisposition('attachment')).toBeNull();
    expect(nombreArchivoDesdeContentDisposition('attachment; filename=""')).toBeNull();
  });

  it('crea el enlace temporal, dispara la descarga y libera la URL', () => {
    vi.useFakeTimers();
    const crearUrl = vi.fn(() => 'blob:fixtech');
    const liberarUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: crearUrl,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: liberarUrl,
      configurable: true,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    descargarArchivo(new Blob(['contenido']), 'reporte.xlsx');

    expect(crearUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="reporte.xlsx"]')).toBeNull();
    vi.runAllTimers();
    expect(liberarUrl).toHaveBeenCalledWith('blob:fixtech');
  });
});
