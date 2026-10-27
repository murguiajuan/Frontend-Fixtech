import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContraofertaData, ContraofertaDialog } from './contraoferta-dialog';
import { crearContraoferta, crearOferta } from '../testing/oferta.fixtures';

describe('ContraofertaDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
  });

  it('envía una contraoferta con monto y mensaje', async () => {
    const fixture = await crear({ oferta: crearOferta(), emisor: 'CLIENTE' });

    expect(texto(fixture)).toContain('Hacer una contraoferta');
    expect(texto(fixture)).toContain('Precio del servicio');

    escribir(fixture, '[formControlName="montoPropuesto"]', '130');
    escribir(fixture, '[formControlName="mensaje"]', '  Puedo pagar 130 soles.  ');
    pulsarBoton(fixture, 'Enviar contraoferta');

    expect(referencia.close).toHaveBeenCalledWith({
      accion: 'CONTRAOFERTA',
      montoPropuesto: 130,
      mensaje: 'Puedo pagar 130 soles.',
    });
  });

  it('no envía una contraoferta sin monto válido', async () => {
    const fixture = await crear({ oferta: crearOferta(), emisor: 'CLIENTE' });

    escribir(fixture, '[formControlName="montoPropuesto"]', '0');
    pulsarBoton(fixture, 'Enviar contraoferta');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(texto(fixture)).toContain('El monto debe ser mayor a cero.');
  });

  it('permite aceptar la contraoferta pendiente del técnico tras confirmar', async () => {
    const oferta = crearOferta({
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'TECNICO', montoPropuesto: 145 })],
    });
    const fixture = await crear({ oferta, emisor: 'CLIENTE' });

    expect(texto(fixture)).toContain('Responder la contraoferta');
    expect(texto(fixture)).toContain('Contraoferta pendiente del Técnico');

    seleccionarRadio(fixture, 'Aceptar la contraoferta');
    pulsarBoton(fixture, 'Aceptar contraoferta');
    fixture.detectChanges();
    expect(referencia.close).not.toHaveBeenCalled();
    expect(texto(fixture)).toContain('Marca la confirmación para continuar.');

    marcarConfirmacion(fixture);
    pulsarBoton(fixture, 'Aceptar contraoferta');

    expect(referencia.close).toHaveBeenCalledWith({
      accion: 'ACEPTAR',
      montoPropuesto: null,
      mensaje: null,
    });
  });

  it('permite rechazar la contraoferta pendiente del cliente tras confirmar', async () => {
    const oferta = crearOferta({
      estado: 'CONTRAOFERTADA',
      contraofertas: [crearContraoferta({ emisor: 'CLIENTE', montoPropuesto: 130 })],
    });
    const fixture = await crear({ oferta, emisor: 'TECNICO' });

    seleccionarRadio(fixture, 'Rechazar la oferta');
    marcarConfirmacion(fixture);
    pulsarBoton(fixture, 'Rechazar oferta');

    expect(referencia.close).toHaveBeenCalledWith({
      accion: 'RECHAZAR',
      montoPropuesto: null,
      mensaje: null,
    });
  });

  it('cierra sin resultado al volver', async () => {
    const fixture = await crear({ oferta: crearOferta(), emisor: 'CLIENTE' });

    pulsarBoton(fixture, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });

  async function crear(datos: ContraofertaData): Promise<ComponentFixture<ContraofertaDialog>> {
    await TestBed.configureTestingModule({
      imports: [ContraofertaDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ContraofertaDialog);
    fixture.detectChanges();
    return fixture;
  }
});

function texto(fixture: ComponentFixture<ContraofertaDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(
  fixture: ComponentFixture<ContraofertaDialog>,
  selector: string,
  valor: string,
): void {
  const campo = (fixture.nativeElement as HTMLElement).querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >(selector);
  if (campo === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function seleccionarRadio(fixture: ComponentFixture<ContraofertaDialog>, etiqueta: string): void {
  const radios = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    ),
  );
  const radio = radios.find((elemento) =>
    elemento.closest('mat-radio-button')?.textContent?.includes(etiqueta),
  );
  if (radio === undefined) {
    throw new Error(`No se encontró la opción ${etiqueta}`);
  }
  radio.click();
  fixture.detectChanges();
}

function marcarConfirmacion(fixture: ComponentFixture<ContraofertaDialog>): void {
  const casilla = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  );
  if (casilla === null) {
    throw new Error('No se encontró la confirmación');
  }
  casilla.click();
  fixture.detectChanges();
}

function pulsarBoton(fixture: ComponentFixture<ContraofertaDialog>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
