import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PinInicioDialog } from './pin-inicio-dialog';

describe('PinInicioDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [PinInicioDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { servicioId: 21, clienteNombre: 'Cliente E2E' },
        },
      ],
    }).compileComponents();
  });

  it('muestra el contexto y solicita el PIN de 4 dígitos', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Validar PIN e iniciar el servicio');
    expect(texto).toContain('Cliente E2E');
    expect(texto).toContain('El PIN tiene exactamente 4 dígitos.');
  });

  it('no confirma con un PIN incompleto', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, '123');
    pulsarBoton(fixture.nativeElement, 'Validar e iniciar');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('El PIN debe tener 4 dígitos numéricos.');
  });

  it('cierra con el PIN y el comentario normalizado', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, '4821');
    escribirComentario(fixture.nativeElement, '  Llegué al domicilio.  ');
    pulsarBoton(fixture.nativeElement, 'Validar e iniciar');

    expect(referencia.close).toHaveBeenCalledWith({
      pin: '4821',
      comentario: 'Llegué al domicilio.',
    });
  });

  it('cierra con comentario nulo cuando no se escribe', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, '0000');
    pulsarBoton(fixture.nativeElement, 'Validar e iniciar');

    expect(referencia.close).toHaveBeenCalledWith({ pin: '0000', comentario: null });
  });

  it('cierra sin resultado al volver', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<PinInicioDialog> {
  const fixture = TestBed.createComponent(PinInicioDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<PinInicioDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(contenedor: HTMLElement, texto: string): void {
  const input = contenedor.querySelector<HTMLInputElement>('input[formcontrolname="pin"]');
  if (input === null) {
    throw new Error('No se encontró el campo PIN');
  }
  input.value = texto;
  input.dispatchEvent(new Event('input'));
}

function escribirComentario(contenedor: HTMLElement, texto: string): void {
  const area = contenedor.querySelector<HTMLTextAreaElement>(
    'textarea[formcontrolname="comentario"]',
  );
  if (area === null) {
    throw new Error('No se encontró el comentario');
  }
  area.value = texto;
  area.dispatchEvent(new Event('input'));
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
