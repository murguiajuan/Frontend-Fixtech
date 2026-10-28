import { TestBed } from '@angular/core/testing';
import { AvisoConexion } from './aviso-conexion';

describe('AvisoConexion', () => {
  beforeEach(async () => {
    definirEstadoRed(true);
    await TestBed.configureTestingModule({ imports: [AvisoConexion] }).compileComponents();
  });

  afterEach(() => {
    definirEstadoRed(true);
  });

  it('no muestra el aviso cuando hay conexión', () => {
    const fixture = TestBed.createComponent(AvisoConexion);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="status"]')).toBeNull();
  });

  it('muestra un aviso accesible al perder la conexión', () => {
    const fixture = TestBed.createComponent(AvisoConexion);
    fixture.detectChanges();
    definirEstadoRed(false);
    globalThis.dispatchEvent(new Event('offline'));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const aviso = compiled.querySelector('[role="status"]');

    expect(aviso).not.toBeNull();
    expect(aviso?.getAttribute('aria-live')).toBe('polite');
    expect(aviso?.textContent).toContain('Sin conexión.');
    expect(aviso?.textContent).toContain('Revisa tu red.');
  });

  it('oculta el aviso al recuperar la conexión', () => {
    definirEstadoRed(false);
    const fixture = TestBed.createComponent(AvisoConexion);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    definirEstadoRed(true);
    globalThis.dispatchEvent(new Event('online'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});

function definirEstadoRed(enLinea: boolean): void {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    configurable: true,
    value: enLinea,
  });
}
