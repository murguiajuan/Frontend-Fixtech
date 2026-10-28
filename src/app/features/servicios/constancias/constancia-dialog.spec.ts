import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ServiciosService } from '../servicios.service';
import { crearConstancia } from '../testing/servicio.fixtures';
import { ConstanciaDialog } from './constancia-dialog';

describe('ConstanciaDialog', () => {
  const referencia = { close: vi.fn() };
  const servicios = { registrarConstancia: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    servicios.registrarConstancia.mockReset();
    servicios.registrarConstancia.mockReturnValue(of(crearConstancia()));

    await TestBed.configureTestingModule({
      imports: [ConstanciaDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { servicioId: 21, tipo: 'RECEPCION' } },
        { provide: ServiciosService, useValue: servicios },
      ],
    }).compileComponents();
  });

  it('muestra el tipo de constancia y las indicaciones', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Constancia de recepción del equipo');
    expect(texto).toContain('adjunta entre 1 y 5 fotos');
    expect(texto).toContain('JPG o PNG de hasta 5 MB');
  });

  it('rechaza archivos que no sean JPG o PNG', () => {
    const fixture = crear();

    seleccionarArchivos(fixture.nativeElement, [
      new File(['documento'], 'constancia.pdf', { type: 'application/pdf' }),
    ]);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('constancia.pdf: solo se permiten imágenes JPG o PNG.');
  });

  it('rechaza imágenes mayores a 5 MB', () => {
    const fixture = crear();
    const grande = new File(['imagen'], 'grande.png', { type: 'image/png' });
    Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });

    seleccionarArchivos(fixture.nativeElement, [grande]);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('grande.png: la imagen supera los 5 MB.');
  });

  it('limita la selección a cinco fotos', () => {
    const fixture = crear();
    const fotos = Array.from(
      { length: 6 },
      (_, indice) => new File(['imagen'], `foto-${indice}.png`, { type: 'image/png' }),
    );

    seleccionarArchivos(fixture.nativeElement, fotos);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Puedes adjuntar hasta 5 fotos.');
    expect(contenido(fixture)).toContain('0 de 5 fotos seleccionadas');
  });

  it('exige al menos una foto', () => {
    const fixture = crear();

    enviar(fixture);

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Adjunta entre 1 y 5 fotos de la constancia.');
  });

  it('permite quitar una foto seleccionada', () => {
    const fixture = crear();
    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'recepcion.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('recepcion.png');

    const quitar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Quitar recepcion.png"]',
    );
    expect(quitar).not.toBeNull();
    quitar?.click();
    fixture.detectChanges();

    expect(contenido(fixture)).not.toContain('recepcion.png');
  });

  it('registra la constancia con los datos normalizados y las fotos', () => {
    const fixture = crear();
    const foto = new File(['imagen'], 'recepcion.png', { type: 'image/png' });

    escribir(fixture.nativeElement, 'input[formcontrolname="accesorios"]', '  Cargador  ');
    escribir(
      fixture.nativeElement,
      'textarea[formcontrolname="observaciones"]',
      '  Equipo con rayones.  ',
    );
    seleccionarArchivos(fixture.nativeElement, [foto]);
    fixture.detectChanges();
    enviar(fixture);

    expect(servicios.registrarConstancia).toHaveBeenCalledWith(
      21,
      {
        tipo: 'RECEPCION',
        observaciones: 'Equipo con rayones.',
        accesorios: 'Cargador',
      },
      [foto],
    );
    expect(referencia.close).toHaveBeenCalledWith(crearConstancia());
  });

  it('envía null cuando los campos opcionales quedan vacíos', () => {
    const fixture = crear();

    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'recepcion.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();
    enviar(fixture);

    expect(servicios.registrarConstancia).toHaveBeenCalledWith(
      21,
      { tipo: 'RECEPCION', observaciones: null, accesorios: null },
      expect.any(Array),
    );
  });

  it('muestra el error del servidor y sus detalles', () => {
    servicios.registrarConstancia.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'No se pudo registrar la constancia.',
        detalles: ['La constancia de recepción ya existe.'],
      })),
    );
    const fixture = crear();

    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'recepcion.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('No se pudo registrar la constancia.');
    expect(contenido(fixture)).toContain('La constancia de recepción ya existe.');
  });

  it('cierra sin resultado al cancelar', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Cancelar');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<ConstanciaDialog> {
  const fixture = TestBed.createComponent(ConstanciaDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ConstanciaDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const campo = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (campo === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
}

function seleccionarArchivos(contenedor: HTMLElement, archivos: readonly File[]): void {
  const input = contenedor.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error('No se encontró el campo de fotos');
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([...archivos], {
      item: (indice: number) => archivos[indice] ?? null,
    }),
  });
  input.dispatchEvent(new Event('change'));
}

function enviar(fixture: ComponentFixture<ConstanciaDialog>): void {
  const formulario = (fixture.nativeElement as HTMLElement).querySelector('form');
  if (formulario === null) {
    throw new Error('No se encontró el formulario de la constancia');
  }
  formulario.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
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
