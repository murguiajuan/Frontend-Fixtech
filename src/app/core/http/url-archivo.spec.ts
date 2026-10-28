import { resolverUrlArchivo } from './url-archivo';

describe('resolverUrlArchivo', () => {
  it('convierte rutas relativas de la API en URLs absolutas', () => {
    expect(resolverUrlArchivo('/api/solicitudes/1/imagenes/2')).toBe(
      'http://localhost:8082/api/solicitudes/1/imagenes/2',
    );
    expect(resolverUrlArchivo('/api/comisiones/pagos/51/comprobante')).toBe(
      'http://localhost:8082/api/comisiones/pagos/51/comprobante',
    );
  });

  it('acepta URLs absolutas del mismo origen y prefijo de API', () => {
    expect(resolverUrlArchivo('http://localhost:8082/api/servicios/9/avances/1/foto')).toBe(
      'http://localhost:8082/api/servicios/9/avances/1/foto',
    );
  });

  it('rechaza orígenes externos', () => {
    expect(resolverUrlArchivo('https://evil.example/api/solicitudes/1/imagenes/2')).toBeNull();
    expect(resolverUrlArchivo('//evil.example/api/solicitudes/1/imagenes/2')).toBeNull();
    expect(resolverUrlArchivo('data:image/png;base64,AAAA')).toBeNull();
    expect(resolverUrlArchivo('javascript:alert(1)')).toBeNull();
  });

  it('rechaza rutas que no pertenecen a la API', () => {
    expect(resolverUrlArchivo('/login')).toBeNull();
    expect(resolverUrlArchivo('/api-evil/solicitudes')).toBeNull();
    expect(resolverUrlArchivo('http://localhost:8082/otra-cosa')).toBeNull();
    expect(resolverUrlArchivo('')).toBeNull();
    expect(resolverUrlArchivo('/api\\solicitudes')).toBeNull();
  });
});
