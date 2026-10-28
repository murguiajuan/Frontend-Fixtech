import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FinalizarServicioDialog } from './finalizar-servicio-dialog';

interface AccesoFormulario {
  readonly formulario: FormGroup;
}

describe('FinalizarServicioDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(async () => {
    referencia.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [FinalizarServicioDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: { servicioId: 21, montoTotal: 160 } },
      ],
    }).compileComponents();
  });

  it('muestra el monto final y los métodos de pago', () => {
    const fixture = crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Finalizar servicio #21');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('Efectivo');
    expect(texto).toContain('Yape');
    expect(texto).toContain('Plin');
    expect(texto).toContain('Transferencia bancaria');
  });

  it('exige seleccionar un método de pago', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Finalizar servicio');
    fixture.detectChanges();

    expect(referencia.close).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Selecciona un método de pago.');
  });

  it('cierra con el monto total y el método elegido', () => {
    const fixture = crear();
    accederFormulario(fixture).controls['metodoPago'].setValue('YAPE');
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Finalizar servicio');

    expect(referencia.close).toHaveBeenCalledWith({ montoFinal: 160, metodoPago: 'YAPE' });
  });

  it('cierra sin resultado al volver', () => {
    const fixture = crear();

    pulsarBoton(fixture.nativeElement, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<FinalizarServicioDialog> {
  const fixture = TestBed.createComponent(FinalizarServicioDialog);
  fixture.detectChanges();
  return fixture;
}

function accederFormulario(fixture: ComponentFixture<FinalizarServicioDialog>): FormGroup {
  return (fixture.componentInstance as unknown as AccesoFormulario).formulario;
}

function contenido(fixture: ComponentFixture<FinalizarServicioDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
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
