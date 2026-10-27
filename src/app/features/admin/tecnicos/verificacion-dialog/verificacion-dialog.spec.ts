import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { TecnicoAdmin, TecnicoVerificacionResponse } from '../../admin.models';
import { AdminTecnicosService } from '../../services/admin-tecnicos.service';
import { VerificacionDialog } from './verificacion-dialog';

const TECNICO: TecnicoAdmin = {
  id: 42,
  usuarioId: 100,
  correo: 'ana.torres@fixtech.pe',
  nombres: 'Ana',
  apellidos: 'Torres',
  dni: '12345678',
  celular: '987654321',
  fotoUrl: null,
  estadoVerificacion: 'PENDIENTE',
  motivoVerificacion: null,
  bloqueadoPorDeuda: false,
  saldoComisionPendiente: 0,
  modalidades: ['DOMICILIO'],
  calificacionPromedio: 4.8,
  totalResenas: 12,
  serviciosCompletados: 20,
  destacado: false,
  fechaVerificacion: null,
  creadoEn: '2026-10-20T10:00:00',
};

const RESPUESTA: TecnicoVerificacionResponse = {
  id: 42,
  estadoVerificacion: 'APROBADO',
  motivoVerificacion: null,
  fechaVerificacion: '2026-10-27T12:00:00',
};

describe('VerificacionDialog', () => {
  const servicio = { verificar: vi.fn() };
  const dialogo = { close: vi.fn() };

  beforeEach(async () => {
    servicio.verificar.mockReset();
    dialogo.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [VerificacionDialog],
      providers: [
        { provide: AdminTecnicosService, useValue: servicio },
        { provide: MatDialogRef, useValue: dialogo },
        { provide: MAT_DIALOG_DATA, useValue: { tecnico: TECNICO } },
      ],
    }).compileComponents();
  });

  it('muestra el resumen y la aprobación por defecto', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Ana Torres');
    expect(compilado.textContent).toContain('ana.torres@fixtech.pe');
    expect(compilado.textContent).toContain('Aprobar perfil');
    expect(compilado.textContent).toContain('La aprobación no requiere motivo.');
  });

  it('exige marcar la confirmación antes de enviar', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.verificar).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Debes marcar la confirmación para continuar.');
  });

  it('exige un motivo al observar o rechazar', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    seleccionarEstado(compilado, 'OBSERVADO');
    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.verificar).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain(
      'El motivo es obligatorio para observar o rechazar al técnico.',
    );
  });

  it('envía la aprobación con motivo nulo y el id del técnico', () => {
    servicio.verificar.mockReturnValue(of(RESPUESTA));
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.verificar).toHaveBeenCalledWith(42, {
      estado: 'APROBADO',
      motivo: null,
    });
    expect(dialogo.close).toHaveBeenCalledWith(RESPUESTA);
  });

  it('envía la observación con el motivo recortado', () => {
    servicio.verificar.mockReturnValue(of(RESPUESTA));
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    seleccionarEstado(compilado, 'OBSERVADO');
    fixture.detectChanges();
    escribirTexto(compilado, '  Falta actualizar la foto del perfil.  ');
    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.verificar).toHaveBeenCalledWith(42, {
      estado: 'OBSERVADO',
      motivo: 'Falta actualizar la foto del perfil.',
    });
    expect(dialogo.close).toHaveBeenCalledWith(RESPUESTA);
  });

  it('muestra el conflicto 409 sin cerrar el diálogo', () => {
    servicio.verificar.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'El técnico ya se encuentra en ese estado.',
        detalles: [],
      })),
    );
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(compilado.textContent).toContain('El técnico ya se encuentra en ese estado.');
    expect(dialogo.close).not.toHaveBeenCalled();
  });
});

function crear(): ComponentFixture<VerificacionDialog> {
  const fixture = TestBed.createComponent(VerificacionDialog);
  fixture.detectChanges();
  return fixture;
}

function seleccionarEstado(compilado: HTMLElement, estado: string): void {
  const radio = compilado.querySelector<HTMLInputElement>(`input[type="radio"][value="${estado}"]`);
  if (radio === null) {
    throw new Error(`No se encontró la opción ${estado}`);
  }
  radio.click();
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
    throw new Error('No se encontró el campo de motivo');
  }
  textarea.value = valor;
  textarea.dispatchEvent(new Event('input'));
}

function enviar(compilado: HTMLElement): void {
  compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
}
