import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { UsuarioAdmin } from '../../admin.models';
import { AdminUsuariosService } from '../../services/admin-usuarios.service';
import { EstadoUsuarioDialog } from './estado-usuario-dialog';

const USUARIO_ACTIVO: UsuarioAdmin = {
  id: 15,
  correo: 'luis.ramos@fixtech.pe',
  rol: 'CLIENTE',
  estado: 'ACTIVO',
  motivoSuspension: null,
  nombres: 'Luis',
  apellidos: 'Ramos',
  creadoEn: '2026-10-20T10:00:00',
};

const USUARIO_SUSPENDIDO: UsuarioAdmin = {
  ...USUARIO_ACTIVO,
  estado: 'SUSPENDIDO',
  motivoSuspension: 'Incumplimiento de las normas de uso.',
};

describe('EstadoUsuarioDialog', () => {
  const servicio = { cambiarEstado: vi.fn() };
  const dialogo = { close: vi.fn() };
  const datos = { usuario: USUARIO_ACTIVO };

  beforeEach(async () => {
    datos.usuario = USUARIO_ACTIVO;
    servicio.cambiarEstado.mockReset();
    dialogo.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [EstadoUsuarioDialog],
      providers: [
        { provide: AdminUsuariosService, useValue: servicio },
        { provide: MatDialogRef, useValue: dialogo },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
  });

  it('muestra la suspensión y advierte sobre el efecto de la acción', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Suspender cuenta');
    expect(compilado.textContent).toContain('Luis Ramos');
    expect(compilado.textContent).toContain('La cuenta quedará suspendida');
  });

  it('exige un motivo para suspender', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.cambiarEstado).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('El motivo es obligatorio para suspender la cuenta.');
  });

  it('exige marcar la confirmación para suspender', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribirTexto(compilado, 'Incumplimiento del acuerdo.');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.cambiarEstado).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Debes marcar la confirmación para continuar.');
  });

  it('suspende usando el id del usuario y el motivo recortado', () => {
    const respuesta = { ...USUARIO_ACTIVO, estado: 'SUSPENDIDO' as const };
    servicio.cambiarEstado.mockReturnValue(of(respuesta));
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribirTexto(compilado, '  Incumplimiento del acuerdo.  ');
    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.cambiarEstado).toHaveBeenCalledWith(15, {
      estado: 'SUSPENDIDO',
      motivo: 'Incumplimiento del acuerdo.',
    });
    expect(dialogo.close).toHaveBeenCalledWith(respuesta);
  });

  it('reactiva sin exigir motivo y envía motivo nulo', () => {
    datos.usuario = USUARIO_SUSPENDIDO;
    const respuesta = { ...USUARIO_SUSPENDIDO, estado: 'ACTIVO' as const, motivoSuspension: null };
    servicio.cambiarEstado.mockReturnValue(of(respuesta));
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Reactivar cuenta');
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.cambiarEstado).toHaveBeenCalledWith(15, {
      estado: 'ACTIVO',
      motivo: null,
    });
    expect(dialogo.close).toHaveBeenCalledWith(respuesta);
  });

  it('muestra el error 403 sin cerrar el diálogo', () => {
    servicio.cambiarEstado.mockReturnValue(
      throwError(() => ({
        estado: 403,
        mensaje: 'No puede cambiar el estado de su propia cuenta',
        detalles: [],
      })),
    );
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribirTexto(compilado, 'Motivo válido.');
    marcarConfirmacion(compilado);
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(compilado.textContent).toContain('No puede cambiar el estado de su propia cuenta');
    expect(dialogo.close).not.toHaveBeenCalled();
  });
});

function crear(): ComponentFixture<EstadoUsuarioDialog> {
  const fixture = TestBed.createComponent(EstadoUsuarioDialog);
  fixture.detectChanges();
  return fixture;
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
