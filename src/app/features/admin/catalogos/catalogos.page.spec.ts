import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
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
    expect(contenido(fixture)).toContain('1 registro · 1 activo');
  });

  it('prioriza los registros activos y resume el resultado cargado', async () => {
    servicio.listar.mockReturnValue(
      of([
        { ...EQUIPO, id: 2, nombre: 'Impresora', activo: false },
        EQUIPO,
        { ...EQUIPO, id: 3, nombre: 'Monitor', activo: true },
      ]),
    );
    const fixture = await crear();

    const nombres = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.catalogo__identidad h3'),
    ).map((elemento) => elemento.textContent?.trim());
    expect(nombres).toEqual(['Laptop', 'Monitor', 'Impresora']);
    expect(contenido(fixture)).toContain('3 registros · 2 activos');
    expect(contenido(fixture)).toContain('Se conserva como historial');
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

    expect(contenido(fixture)).toContain('Aún no hay tipos de equipo');
    expect(contenido(fixture)).toContain('Usa «Nuevo tipo de equipo»');

    const casilla = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    casilla?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No hay registros activos');
    expect(contenido(fixture)).toContain('no tiene registros disponibles');
    expect(contenido(fixture)).toContain('Mostrar inactivos');
    expect(contenido(fixture)).toContain('0 registros activos');
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
    expect(contenido(fixture)).not.toContain('registros ·');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Laptop');
  });

  it('conserva el estado de procesamiento al volver a un catálogo', async () => {
    const respuesta = new Subject<CatalogoAdmin>();
    servicio.listar.mockImplementation((tipo: string) =>
      of(tipo === 'distritos' ? [DISTRITO] : [EQUIPO]),
    );
    servicio.cambiarEstado.mockReturnValue(respuesta.asObservable());
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Desactivar');
    fixture.detectChanges();
    expect(boton(fixture, 'Desactivar')?.disabled).toBe(true);

    pulsarBoton(fixture.nativeElement, 'Distritos');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Castilla');

    pulsarBoton(fixture.nativeElement, 'Tipos de equipo');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(boton(fixture, 'Desactivar')?.disabled).toBe(true);

    respuesta.next({ ...EQUIPO, activo: false });
    respuesta.complete();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(notificaciones.exito).toHaveBeenCalledWith('Se desactivó «Laptop».');
    expect(servicio.listar).toHaveBeenLastCalledWith('tipos-equipo', true);
    expect(boton(fixture, 'Desactivar')?.disabled).toBe(false);
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

function boton(
  fixture: ComponentFixture<AdminCatalogosPage>,
  texto: string,
): HTMLButtonElement | undefined {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  ).find((elemento) => elemento.textContent?.includes(texto));
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const encontrado = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (encontrado === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  encontrado.click();
}
