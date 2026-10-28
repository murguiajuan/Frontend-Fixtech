import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { CatalogoAdmin } from './catalogos-admin.models';
import { CatalogoFormDialog } from './catalogo-form-dialog';
import { AdminCatalogosPage } from './catalogos.page';
import { AdminCatalogosService } from '../services/admin-catalogos.service';

const EQUIPO: CatalogoAdmin = { id: 1, nombre: 'Laptop', activo: true };
const DISTRITO: CatalogoAdmin = {
  id: 4,
  nombre: 'Castilla',
  provincia: 'Piura',
  topeMovilidad: 12.5,
  activo: true,
};

describe('AdminCatalogosPage', () => {
  const servicio = {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    cambiarEstado: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of([EQUIPO]));
    servicio.cambiarEstado.mockReset();
    servicio.cambiarEstado.mockReturnValue(of({ ...EQUIPO, activo: false }));
    dialogo.open.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminCatalogosPage],
      providers: [
        { provide: AdminCatalogosService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('carga el catálogo inicial incluyendo inactivos', async () => {
    const fixture = await crear();

    expect(servicio.listar).toHaveBeenCalledWith('tipos-equipo', true);
    expect(contenido(fixture)).toContain('Tipos de equipo');
    expect(contenido(fixture)).toContain('Laptop');
    expect(contenido(fixture)).toContain('Activo');
  });

  it('cambia de catálogo y muestra el detalle propio de cada tipo', async () => {
    const fixture = await crear();
    servicio.listar.mockReturnValue(of([DISTRITO]));

    pulsarBoton(fixture.nativeElement, 'Distritos');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith('distritos', true);
    expect(contenido(fixture)).toContain('Castilla');
    expect(contenido(fixture)).toContain('Piura · Tope de movilidad S/ 12.50');
  });

  it('oculta los inactivos al desmarcar la casilla', async () => {
    const fixture = await crear();
    const casilla = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );

    expect(casilla).not.toBeNull();
    casilla?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith('tipos-equipo', false);
  });

  it('abre el diálogo de alta y recarga el catálogo al crear', async () => {
    servicio.listar.mockReturnValueOnce(of([EQUIPO])).mockReturnValue(of([EQUIPO]));
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ id: 9, nombre: 'Impresora', activo: true }),
    });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Nuevo tipo de equipo');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      CatalogoFormDialog,
      expect.objectContaining({ data: { tipo: 'tipos-equipo', item: null } }),
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Se creó tipo de equipo «Impresora».');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('abre el diálogo con el registro al editar', async () => {
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ ...EQUIPO, nombre: 'Laptop Pro' }),
    });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Editar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      CatalogoFormDialog,
      expect.objectContaining({ data: { tipo: 'tipos-equipo', item: EQUIPO } }),
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Se actualizó tipo de equipo «Laptop Pro».');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('confirma la desactivación y recarga el catálogo', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Desactivar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ titulo: 'Desactivar tipo de equipo', peligro: true }),
      }),
    );
    expect(servicio.cambiarEstado).toHaveBeenCalledWith('tipos-equipo', 1, false);
    expect(notificaciones.exito).toHaveBeenCalledWith('Se desactivó «Laptop».');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('activa un registro sin pedir confirmación', async () => {
    servicio.listar.mockReturnValue(of([{ ...EQUIPO, activo: false }]));
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Activar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).not.toHaveBeenCalled();
    expect(servicio.cambiarEstado).toHaveBeenCalledWith('tipos-equipo', 1, true);
    expect(notificaciones.exito).toHaveBeenCalledWith('Se activó «Laptop».');
  });

  it('muestra el estado vacío y permite mostrar los inactivos', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No se encontraron registros');

    const casilla = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    casilla?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('no tiene registros activos');
    expect(contenido(fixture)).toContain('Mostrar inactivos');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener los catálogos.',
          detalles: ['Intente más tarde.'],
        })),
      )
      .mockReturnValue(of([EQUIPO]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar el catálogo');
    expect(contenido(fixture)).toContain('No se pudieron obtener los catálogos.');
    expect(contenido(fixture)).toContain('Intente más tarde.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Laptop');
  });

  it('informa el error al cambiar el estado', async () => {
    servicio.cambiarEstado.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'El catálogo está en uso y no puede desactivarse.',
        detalles: [],
      })),
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Desactivar');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(notificaciones.error).toHaveBeenCalledWith(
      'El catálogo está en uso y no puede desactivarse.',
    );
    expect(servicio.listar).toHaveBeenCalledTimes(1);
  });
});

async function crear(): Promise<ComponentFixture<AdminCatalogosPage>> {
  const fixture = TestBed.createComponent(AdminCatalogosPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<AdminCatalogosPage>): string {
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
