import { urlRetornoSegura } from './return-url';

describe('urlRetornoSegura', () => {
  it('usa el inicio cuando no hay returnUrl', () => {
    expect(urlRetornoSegura(null)).toBe('/app/inicio');
    expect(urlRetornoSegura('')).toBe('/app/inicio');
    expect(urlRetornoSegura('   ')).toBe('/app/inicio');
  });

  it('acepta rutas internas de la aplicación', () => {
    expect(urlRetornoSegura('/app/inicio')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app/cliente/solicitudes')).toBe('/app/cliente/solicitudes');
    expect(urlRetornoSegura('/app/notificaciones?filtro=no-leidas')).toBe(
      '/app/notificaciones?filtro=no-leidas',
    );
    expect(urlRetornoSegura('/app/servicios/12#avances')).toBe('/app/servicios/12#avances');
    expect(urlRetornoSegura('/app')).toBe('/app');
  });

  it('rechaza redirecciones externas y protocolo-relativas', () => {
    expect(urlRetornoSegura('https://evil.example/app')).toBe('/app/inicio');
    expect(urlRetornoSegura('//evil.example/app')).toBe('/app/inicio');
    expect(urlRetornoSegura('/\\evil.example/app')).toBe('/app/inicio');
    expect(urlRetornoSegura('javascript:alert(1)')).toBe('/app/inicio');
    expect(urlRetornoSegura('/login?returnUrl=/app')).toBe('/app/inicio');
    expect(urlRetornoSegura('/application')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app-evil')).toBe('/app/inicio');
  });

  it('rechaza rutas que escapan de /app al normalizarse', () => {
    expect(urlRetornoSegura('/app/../admin')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app/%2e%2e/admin')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app/./inicio')).toBe('/app/inicio');
  });

  it('rechaza rutas que solo comparten el prefijo /app', () => {
    expect(urlRetornoSegura('/app@evil.example')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app%2f..%2fadmin')).toBe('/app/inicio');
    expect(urlRetornoSegura('/app/%00')).toBe('/app/inicio');
  });
});
