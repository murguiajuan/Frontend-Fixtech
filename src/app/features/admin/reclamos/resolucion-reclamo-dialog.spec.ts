import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResolucionReclamoDialog } from './resolucion-reclamo-dialog';

describe('ResolucionReclamoDialog', () => {
  const referencia = { close: vi.fn() };

  async function configurar(estado: 'RESUELTO' | 'CERRADO', resolucionActual = ''): Promise<void> {
    referencia.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [ResolucionReclamoDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { estado, resolucionActual } },
      ],
    }).compileComponents();
  }

  it('muestra el título y la resolución actual al resolver', async () => {
    await configurar('RESUELTO', 'Resolución previa.');
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Resolver reclamo');
    expect(texto).toContain('La resolución será visible para el cliente y el técnico');
    const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>(
      'textarea[formcontrolname="resolucion"]',
    );
    expect(campo?.value).toBe('Resolución previa.');
  });

  it('muestra el título de cierre al cerrar', async () => {
    await configurar('CERRADO');
    const fixture = crear();

    expect(contenido(fixture)).toContain('Cerrar reclamo');
  });

  it('exige la resolución', async () => {
    await configurar('RESUELTO');
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Resolver reclamo');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La resolución es obligatoria.');
  });

  it('no admite una resolución compuesta solo por espacios', async () => {
    await configurar('RESUELTO');
    const fixture = crear();
    escribir(fixture.nativeElement, 'textarea[formcontrolname="resolucion"]', '   ');
    pulsarBoton(fixture.nativeElement, 'Resolver reclamo');
    fixture.detectChanges();
    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La resolución es obligatoria.');
  });

  it('cierra con la resolución normalizada', async () => {
    await configurar('RESUELTO');
    const fixture = crear();

    escribir(
      fixture.nativeElement,
      'textarea[formcontrolname="resolucion"]',
      '  Se reemplazó el repuesto defectuoso.  ',
    );
    pulsarBoton(fixture.nativeElement, 'Resolver reclamo');
    fixture.detectChanges();

    expect(referencia.close).toHaveBeenCalledWith({
      resolucion: 'Se reemplazó el repuesto defectuoso.',
    });
  });

  it('cierra sin resultado al cancelar', async () => {
    await configurar('CERRADO');
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Cancelar');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<ResolucionReclamoDialog> {
  const fixture = TestBed.createComponent(ResolucionReclamoDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ResolucionReclamoDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const campo = contenedor.querySelector<HTMLTextAreaElement>(selector);
  if (campo === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  campo.value = texto;
  campo.dispatchEvent(new Event('input'));
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
