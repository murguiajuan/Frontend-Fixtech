import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ServiciosService } from '../servicios.service';
import { crearReclamo } from '../testing/servicio.fixtures';
import { ReclamoDialog } from './reclamo-dialog';

describe('ReclamoDialog', () => {
  const referencia = { close: vi.fn() };
  const servicios = { crearReclamo: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    servicios.crearReclamo.mockReset();
    servicios.crearReclamo.mockReturnValue(of(crearReclamo()));

    await TestBed.configureTestingModule({
      imports: [ReclamoDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { servicioId: 21 } },
        { provide: ServiciosService, useValue: servicios },
      ],
    }).compileComponents();
  });

  it('muestra las indicaciones para registrar el reclamo', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Registrar reclamo');
    expect(texto).toContain('adjunta entre 1 y 5 fotos');
    expect(texto).toContain('Máximo 2000 caracteres');
  });

  it('exige la descripción', () => {
    const fixture = crear();

    enviar(fixture);

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La descripción es obligatoria.');
  });

  it('exige al menos una foto', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, 'textarea[formcontrolname="descripcion"]', 'El equipo falló.');
    enviar(fixture);

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Adjunta entre 1 y 5 fotos como evidencia del reclamo.');
  });

  it('rechaza archivos que no sean JPG o PNG', () => {
    const fixture = crear();

    seleccionarArchivos(fixture.nativeElement, [
      new File(['documento'], 'reclamo.pdf', { type: 'application/pdf' }),
    ]);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('reclamo.pdf: solo se permiten imágenes JPG o PNG.');
  });

  it('limita la selección a cinco fotos', () => {
    const fixture = crear();
    const fotos = Array.from(
      { length: 6 },
      (_, indice) => new File(['imagen'], `foto-${indice}.jpg`, { type: 'image/jpeg' }),
    );

    seleccionarArchivos(fixture.nativeElement, fotos);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Puedes adjuntar hasta 5 fotos.');
    expect(contenido(fixture)).toContain('0 de 5 fotos seleccionadas');
  });

  it('permite quitar una foto seleccionada', () => {
    const fixture = crear();
    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'falla.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('falla.png');

    const quitar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Quitar falla.png"]',
    );
    expect(quitar).not.toBeNull();
    quitar?.click();
    fixture.detectChanges();

    expect(contenido(fixture)).not.toContain('falla.png');
  });

  it('registra el reclamo con la descripción normalizada y las fotos', () => {
    const fixture = crear();
    const foto = new File(['imagen'], 'falla.png', { type: 'image/png' });

    escribir(
      fixture.nativeElement,
      'textarea[formcontrolname="descripcion"]',
      '  El equipo volvió a fallar.  ',
    );
    seleccionarArchivos(fixture.nativeElement, [foto]);
    fixture.detectChanges();
    enviar(fixture);

    expect(servicios.crearReclamo).toHaveBeenCalledWith(21, 'El equipo volvió a fallar.', [foto]);
    expect(referencia.close).toHaveBeenCalledWith(crearReclamo());
  });

  it('muestra el error del servidor y sus detalles', () => {
    servicios.crearReclamo.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'No se pudo registrar el reclamo.',
        detalles: ['Ya existe un reclamo activo para el servicio.'],
      })),
    );
    const fixture = crear();

    escribir(
      fixture.nativeElement,
      'textarea[formcontrolname="descripcion"]',
      'El equipo falló otra vez.',
    );
    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'falla.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('No se pudo registrar el reclamo.');
    expect(contenido(fixture)).toContain('Ya existe un reclamo activo para el servicio.');
  });

  it('cierra sin resultado al cancelar', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Cancelar');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<ReclamoDialog> {
  const fixture = TestBed.createComponent(ReclamoDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ReclamoDialog>): string {
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

function enviar(fixture: ComponentFixture<ReclamoDialog>): void {
  const formulario = (fixture.nativeElement as HTMLElement).querySelector('form');
  if (formulario === null) {
    throw new Error('No se encontró el formulario del reclamo');
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
