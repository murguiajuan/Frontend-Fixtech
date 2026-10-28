import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmarAccionData, ConfirmarAccionDialog } from './confirmar-accion-dialog';

describe('ConfirmarAccionDialog', () => {
  const referencia = { close: vi.fn() };
  let datos: ConfirmarAccionData;

  beforeEach(async () => {
    referencia.close.mockReset();
    datos = {
      titulo: 'Aceptar oferta',
      mensaje: '¿Aceptas la oferta por S/ 160.00?',
      detalle: 'Se creará el servicio con el técnico.',
      icono: 'handshake',
      etiquetaConfirmar: 'Aceptar y crear servicio',
    };
    await TestBed.configureTestingModule({
      imports: [ConfirmarAccionDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
  });

  it('muestra el contexto y las etiquetas configuradas', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Aceptar oferta');
    expect(texto).toContain('¿Aceptas la oferta por S/ 160.00?');
    expect(texto).toContain('Se creará el servicio con el técnico.');
    expect(texto).toContain('Aceptar y crear servicio');
    expect(texto).toContain('Volver');
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
  });

  it('cierra con motivo nulo cuando no se solicita motivo', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Aceptar y crear servicio');

    expect(referencia.close).toHaveBeenCalledWith({ motivo: null });
  });

  it('exige el motivo cuando está configurado como requerido', () => {
    Object.assign(datos, {
      titulo: 'Cancelar servicio',
      peligro: true,
      etiquetaConfirmar: 'Cancelar servicio',
      motivo: {
        etiqueta: 'Motivo de cancelación',
        requerido: true,
        maxLongitud: 300,
      },
    });
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Cancelar servicio');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Escribe un motivo para continuar.');
  });

  it('devuelve el motivo normalizado', () => {
    Object.assign(datos, {
      motivo: {
        etiqueta: 'Motivo',
        requerido: true,
        maxLongitud: 300,
      },
    });
    const fixture = crear();

    escribir(fixture.nativeElement, '  Equipo irreparable.  ');
    pulsarBoton(fixture.nativeElement, 'Aceptar y crear servicio');

    expect(referencia.close).toHaveBeenCalledWith({ motivo: 'Equipo irreparable.' });
  });

  it('cierra sin resultado al volver', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<ConfirmarAccionDialog> {
  const fixture = TestBed.createComponent(ConfirmarAccionDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ConfirmarAccionDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
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
