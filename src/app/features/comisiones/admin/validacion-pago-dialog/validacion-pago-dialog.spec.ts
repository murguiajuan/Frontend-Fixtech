import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DecisionPago } from '../../comision.models';
import { AdminComisionesService } from '../../services/admin-comisiones.service';
import { crearPago } from '../../testing/comision.fixtures';
import { ValidacionPagoDialog, ValidacionPagoDialogData } from './validacion-pago-dialog';

registerLocaleData(localeEsPe);

const servicio = { validarPago: vi.fn() };
const dialogo = { close: vi.fn() };

describe('ValidacionPagoDialog', () => {
  beforeEach(() => {
    servicio.validarPago.mockReset();
    dialogo.close.mockReset();
  });

  it('muestra el resumen y la acción de validación', async () => {
    await configurar('VALIDADO');
    const fixture = crear();
    const texto = contenido(fixture);

    expect(texto).toContain('Validar pago #51');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('maria.quispe@fixtech.pe');
    expect(texto).toContain('10.80');
    expect(texto).toContain('En revisión');
    expect(texto).toContain('Las comisiones incluidas quedarán pagadas');
  });

  it('exige marcar la confirmación antes de enviar', async () => {
    await configurar('VALIDADO');
    const fixture = crear();

    enviar(fixture.nativeElement);
    fixture.detectChanges();

    expect(servicio.validarPago).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Debes marcar la confirmación para continuar.');
  });

  it('exige un motivo cuando la decisión es rechazar', async () => {
    await configurar('RECHAZADO');
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(contenido(fixture)).toContain('Rechazar pago #51');
    expect(contenido(fixture)).toContain('El pago quedará rechazado');

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.validarPago).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('El motivo es obligatorio para rechazar el pago.');
  });

  it('valida el pago sin observación y cierra con el resultado', async () => {
    const pagoValidado = crearPago({ estado: 'VALIDADO' });
    servicio.validarPago.mockReturnValue(of(pagoValidado));
    await configurar('VALIDADO');
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.validarPago).toHaveBeenCalledWith(51, {
      estado: 'VALIDADO',
      observacion: null,
    });
    expect(dialogo.close).toHaveBeenCalledWith(pagoValidado);
  });

  it('envía el motivo recortado al rechazar el pago', async () => {
    const pagoRechazado = crearPago({ estado: 'RECHAZADO' });
    servicio.validarPago.mockReturnValue(of(pagoRechazado));
    await configurar('RECHAZADO');
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribirTexto(compilado, '  El comprobante no coincide con la operación.  ');
    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.validarPago).toHaveBeenCalledWith(51, {
      estado: 'RECHAZADO',
      observacion: 'El comprobante no coincide con la operación.',
    });
    expect(dialogo.close).toHaveBeenCalledWith(pagoRechazado);
  });

  it('muestra el error del servidor y mantiene el diálogo abierto', async () => {
    servicio.validarPago.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'El pago ya fue validado por otro administrador.',
        detalles: ['Recarga la lista de pagos.'],
      })),
    );
    await configurar('VALIDADO');
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('El pago ya fue validado por otro administrador.');
    expect(contenido(fixture)).toContain('Recarga la lista de pagos.');
    expect(dialogo.close).not.toHaveBeenCalled();
  });
});

async function configurar(decision: DecisionPago): Promise<void> {
  const datos: ValidacionPagoDialogData = {
    pago: crearPago(),
    decision,
  };
  await TestBed.configureTestingModule({
    imports: [ValidacionPagoDialog],
    providers: [
      { provide: AdminComisionesService, useValue: servicio },
      { provide: MatDialogRef, useValue: dialogo },
      { provide: MAT_DIALOG_DATA, useValue: datos },
    ],
  }).compileComponents();
}

function crear(): ComponentFixture<ValidacionPagoDialog> {
  const fixture = TestBed.createComponent(ValidacionPagoDialog);
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ValidacionPagoDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function marcarConfirmacion(compilado: HTMLElement): void {
  const checkbox = compilado.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (checkbox === null) {
    throw new Error('No se encontró la confirmación');
  }
  checkbox.click();
}

function escribirTexto(compilado: HTMLElement, valor: string): void {
  const textarea = compilado.querySelector<HTMLTextAreaElement>('textarea');
  if (textarea === null) {
    throw new Error('No se encontró el campo de observación');
  }
  textarea.value = valor;
  textarea.dispatchEvent(new Event('input'));
}

function enviar(compilado: HTMLElement): void {
  compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
}
