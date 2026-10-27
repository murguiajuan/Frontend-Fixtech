import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { TecnicoAdmin, TecnicoVerificacionResponse } from '../admin.models';
import { AdminTecnicosService } from '../services/admin-tecnicos.service';
import { VerificacionDialog } from './verificacion-dialog/verificacion-dialog';
import { AdminTecnicosPage } from './tecnicos.page';

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
  modalidades: ['DOMICILIO', 'TALLER'],
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

describe('AdminTecnicosPage', () => {
  const servicio = { listar: vi.fn() };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of([TECNICO]));
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    await TestBed.configureTestingModule({
      imports: [AdminTecnicosPage],
      providers: [
        { provide: AdminTecnicosService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('carga y muestra el listado de técnicos', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(servicio.listar).toHaveBeenCalledWith({
      estadoVerificacion: 'TODOS',
      busqueda: '',
    });
    expect(compilado.textContent).toContain('Ana Torres');
    expect(compilado.textContent).toContain('ana.torres@fixtech.pe');
    expect(compilado.textContent).toContain('En revisión');
    expect(compilado.textContent).toContain('12345678');
  });

  it('aplica la búsqueda y conserva el filtro de estado', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'input[type="search"]', '  ana  ');
    fixture.detectChanges();
    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({
      estadoVerificacion: 'TODOS',
      busqueda: 'ana',
    });
  });

  it('muestra el estado vacío', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Aún no hay técnicos');
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo obtener el listado.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([TECNICO]));
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('No pudimos cargar los técnicos');
    expect(compilado.textContent).toContain('No se pudo obtener el listado.');

    pulsarBoton(compilado, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Ana Torres');
  });

  it('expande el detalle con contacto, modalidades y nota de documentos', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Ver detalle');
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Detalle del perfil');
    expect(compilado.textContent).toContain('A domicilio');
    expect(compilado.textContent).toContain('En taller');
    expect(compilado.textContent).toContain(
      'La API de administración no expone documentos de verificación.',
    );
  });

  it('abre el diálogo con el técnico y recarga tras la verificación', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of(RESPUESTA) });
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Verificar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      VerificacionDialog,
      expect.objectContaining({ data: { tecnico: TECNICO } }),
    );
    expect(notificaciones.exito).toHaveBeenCalled();
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });
});

async function crear(): Promise<ComponentFixture<AdminTecnicosPage>> {
  const fixture = TestBed.createComponent(AdminTecnicosPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function escribir(contenedor: HTMLElement, selector: string, valor: string): void {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
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
