import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AjustePrecioDialog } from './ajuste-precio-dialog';

describe('AjustePrecioDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [AjustePrecioDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { montoActual: 160 } },
      ],
    }).compileComponents();
  });

  it('muestra el monto actual y el contexto del ajuste', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Proponer ajuste de precio');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('Debe ser mayor a S/ 160.00');
    expect(texto).toContain('El servicio quedará pendiente de ajuste');
  });

  it('rechaza un monto menor o igual al actual', () => {
    const fixture = crear();

    escribirMonto(fixture.nativeElement, '160');
    escribirJustificacion(fixture.nativeElement, 'Cambio de repuesto.');
    pulsarBoton(fixture.nativeElement, 'Enviar propuesta');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('El monto debe ser mayor al total actual del servicio.');
  });

  it('exige la justificación', () => {
    const fixture = crear();

    escribirMonto(fixture.nativeElement, '200');
    pulsarBoton(fixture.nativeElement, 'Enviar propuesta');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La justificación es obligatoria.');
  });

  it('cierra con el monto, la justificación y la evidencia', () => {
    const fixture = crear();
    const evidencia = new File(['imagen'], 'repuesto.png', { type: 'image/png' });

    escribirMonto(fixture.nativeElement, '200');
    escribirJustificacion(fixture.nativeElement, '  Repuesto original.  ');
    seleccionarArchivo(fixture.nativeElement, evidencia);
    fixture.detectChanges();
    pulsarBoton(fixture.nativeElement, 'Enviar propuesta');

    expect(referencia.close).toHaveBeenCalledWith({
      montoNuevo: 200,
      justificacion: 'Repuesto original.',
      evidencia,
    });
  });

  it('rechaza archivos que no sean JPG o PNG', () => {
    const fixture = crear();

    seleccionarArchivo(
      fixture.nativeElement,
      new File(['documento'], 'evidencia.pdf', { type: 'application/pdf' }),
    );
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('evidencia.pdf: solo se permiten imágenes JPG o PNG.');
  });

  it('rechaza imágenes mayores a 5 MB', () => {
    const fixture = crear();
    const grande = new File(['imagen'], 'grande.png', { type: 'image/png' });
    Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });

    seleccionarArchivo(fixture.nativeElement, grande);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('grande.png: la imagen supera los 5 MB.');
  });

  it('permite quitar la evidencia seleccionada', () => {
    const fixture = crear();
    const evidencia = new File(['imagen'], 'repuesto.png', { type: 'image/png' });
    seleccionarArchivo(fixture.nativeElement, evidencia);
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('repuesto.png');

    const quitar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Quitar repuesto.png"]',
    );
    expect(quitar).not.toBeNull();
    quitar?.click();
    fixture.detectChanges();

    expect(contenido(fixture)).not.toContain('repuesto.png');
  });

  it('cierra sin resultado al volver', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<AjustePrecioDialog> {
  const fixture = TestBed.createComponent(AjustePrecioDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<AjustePrecioDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribirMonto(contenedor: HTMLElement, texto: string): void {
  escribir(contenedor, 'input[formcontrolname="montoNuevo"]', texto);
}

function escribirJustificacion(contenedor: HTMLElement, texto: string): void {
  escribir(contenedor, 'textarea[formcontrolname="justificacion"]', texto);
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const input = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = texto;
  input.dispatchEvent(new Event('input'));
}

function seleccionarArchivo(contenedor: HTMLElement, archivo: File): void {
  const input = contenedor.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error('No se encontró el campo de evidencia');
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([archivo], {
      item: (indice: number) => (indice === 0 ? archivo : null),
    }),
  });
  input.dispatchEvent(new Event('change'));
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
