import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CancelarSolicitudDialog } from './cancelar-solicitud-dialog';

describe('CancelarSolicitudDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [CancelarSolicitudDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { id: 15 } },
      ],
    }).compileComponents();
  });

  it('muestra la advertencia y el identificador de la solicitud', () => {
    const fixture = crear();

    expect(fixture.nativeElement.textContent).toContain('Cancelar solicitud #15');
    expect(fixture.nativeElement.textContent).toContain('Esta acción no se puede deshacer.');
    expect(fixture.nativeElement.textContent).toContain('Motivo de cancelación (opcional)');
  });

  it('cierra con null cuando no se indica motivo', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Sí, cancelar solicitud');

    expect(referencia.close).toHaveBeenCalledWith(null);
  });

  it('cierra con el motivo normalizado', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, '  Ya se resolvió por otro medio.  ');
    pulsarBoton(fixture.nativeElement, 'Sí, cancelar solicitud');

    expect(referencia.close).toHaveBeenCalledWith('Ya se resolvió por otro medio.');
  });

  it('no confirma cuando el motivo supera los 300 caracteres', () => {
    const fixture = crear();

    escribir(fixture.nativeElement, 'a'.repeat(301));
    pulsarBoton(fixture.nativeElement, 'Sí, cancelar solicitud');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'El motivo no puede superar los 300 caracteres.',
    );
  });

  it('cierra sin resultado al volver', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<CancelarSolicitudDialog> {
  const fixture = TestBed.createComponent(CancelarSolicitudDialog);
  fixture.detectChanges();
  return fixture;
}

function escribir(contenedor: HTMLElement, texto: string): void {
  const area = contenedor.querySelector<HTMLTextAreaElement>('textarea');
  if (area === null) {
    throw new Error('No se encontró el campo de motivo');
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
