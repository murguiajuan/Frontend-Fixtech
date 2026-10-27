import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PerfilUsuario } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { UsuarioAdmin } from '../admin.models';
import { AdminUsuariosService } from '../services/admin-usuarios.service';
import { EstadoUsuarioDialog } from './estado-usuario-dialog/estado-usuario-dialog';
import { AdminUsuariosPage } from './usuarios.page';

const PERFIL_ADMIN: PerfilUsuario = {
  id: 2,
  correo: 'admin2@fixtech.pe',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  nombres: 'María',
  apellidos: 'Paredes',
  fotoUrl: null,
  tecnico: null,
};

const ADMIN: UsuarioAdmin = {
  id: 1,
  correo: 'admin@fixtech.pe',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  motivoSuspension: null,
  nombres: 'Admin',
  apellidos: 'FIXTECH',
  creadoEn: '2026-10-01T09:00:00',
};

const PROPIO: UsuarioAdmin = {
  id: 2,
  correo: 'admin2@fixtech.pe',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  motivoSuspension: null,
  nombres: 'María',
  apellidos: 'Paredes',
  creadoEn: '2026-10-02T09:00:00',
};

const CLIENTE: UsuarioAdmin = {
  id: 3,
  correo: 'cliente@fixtech.pe',
  rol: 'CLIENTE',
  estado: 'ACTIVO',
  motivoSuspension: null,
  nombres: 'Lucía',
  apellidos: 'Ramos',
  creadoEn: '2026-10-03T09:00:00',
};

const SUSPENDIDO: UsuarioAdmin = {
  id: 4,
  correo: 'suspendido@fixtech.pe',
  rol: 'TECNICO',
  estado: 'SUSPENDIDO',
  motivoSuspension: 'Incumplimiento de las normas.',
  nombres: null,
  apellidos: null,
  creadoEn: '2026-10-04T09:00:00',
};

describe('AdminUsuariosPage', () => {
  const servicio = { listar: vi.fn() };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };
  const auth = { perfil: signal<PerfilUsuario | null>(PERFIL_ADMIN) };

  beforeEach(async () => {
    auth.perfil.set(PERFIL_ADMIN);
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of([ADMIN, PROPIO, CLIENTE, SUSPENDIDO]));
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    await TestBed.configureTestingModule({
      imports: [AdminUsuariosPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: AdminUsuariosService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra usuarios, roles, estados y reemplaza nombres nulos por el correo', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(servicio.listar).toHaveBeenCalledWith({
      rol: 'TODOS',
      estado: 'TODOS',
      busqueda: '',
    });
    expect(compilado.textContent).toContain('Lucía Ramos');
    expect(compilado.textContent).toContain('cliente@fixtech.pe');
    expect(compilado.textContent).toContain('Suspendido');
    expect(compilado.textContent).toContain('suspendido@fixtech.pe');
    expect(compilado.textContent).toContain('Incumplimiento de las normas.');
  });

  it('protege las cuentas administradoras y la cuenta propia', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Cuenta administradora protegida');
    expect(compilado.textContent).toContain('Tu cuenta está protegida');

    const articuloAdmin = compilado.querySelector('#usuario-1')?.closest('article');
    const articuloPropio = compilado.querySelector('#usuario-2')?.closest('article');
    const articuloCliente = compilado.querySelector('#usuario-3')?.closest('article');

    expect(articuloAdmin?.querySelector('button')).toBeNull();
    expect(articuloPropio?.querySelector('button')).toBeNull();
    expect(articuloCliente?.querySelector('button')?.textContent).toContain('Suspender');
  });

  it('aplica la búsqueda de usuarios', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'input[type="search"]', '  lucía  ');
    fixture.detectChanges();
    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({
      rol: 'TODOS',
      estado: 'TODOS',
      busqueda: 'lucía',
    });
  });

  it('muestra el estado vacío', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Aún no hay usuarios');
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo obtener el listado de usuarios.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([CLIENTE]));
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('No pudimos cargar los usuarios');
    expect(compilado.textContent).toContain('No se pudo obtener el listado de usuarios.');

    pulsarBoton(compilado, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Lucía Ramos');
  });

  it('abre el diálogo con el usuario y recarga tras el cambio de estado', async () => {
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ ...CLIENTE, estado: 'SUSPENDIDO' }),
    });
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Suspender');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      EstadoUsuarioDialog,
      expect.objectContaining({ data: { usuario: CLIENTE } }),
    );
    expect(notificaciones.exito).toHaveBeenCalled();
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });
});

async function crear(): Promise<ComponentFixture<AdminUsuariosPage>> {
  const fixture = TestBed.createComponent(AdminUsuariosPage);
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
