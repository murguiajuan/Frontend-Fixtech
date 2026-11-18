import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ConfirmarAccionDialog } from '../../../shared/ui/confirmar-accion-dialog';
import { Resena } from '../../servicios/servicio.models';
import { crearResena } from '../../servicios/testing/servicio.fixtures';
import { AdminResenasService } from '../services/admin-resenas.service';
import { AdminResenasPage } from './resenas.page';

interface AccesoFormulario {
  readonly formularioFiltros: FormGroup;
}

describe('AdminResenasPage', () => {
  const servicio = { listar: vi.fn(), moderar: vi.fn() };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of([crearResena()] as readonly Resena[]));
    servicio.moderar.mockReset();
    servicio.moderar.mockReturnValue(of(crearResena({ estado: 'OCULTA' })));
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminResenasPage],
      providers: [
        { provide: AdminResenasService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('carga y muestra las reseñas con su estado y criterios', async () => {
    const fixture = await crear();

    expect(servicio.listar).toHaveBeenCalledWith({ estado: 'TODOS' });
    const texto = contenido(fixture);
    expect(texto).toContain('Cliente E2E');
    expect(texto).toContain('Servicio #21 · Técnico María Quispe');
    expect(texto).toContain('Visible');
    expect(texto).toContain('Puntualidad 5/5');
    expect(texto).toContain('Trato 4/5');
    expect(texto).toContain('Excelente atención y explicación del problema.');
  });

  it('prioriza las reportadas y cuenta solo las incluidas en el resultado', async () => {
    servicio.listar.mockReturnValue(
      of([
        crearResena({ id: 40, clienteNombre: 'Visible', estado: 'VISIBLE' }),
        crearResena({
          id: 41,
          clienteNombre: 'Reportada',
          estado: 'REPORTADA',
          motivoReporte: 'Contenido ofensivo.',
        }),
      ]),
    );
    const fixture = await crear();
    const elemento = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(elemento.querySelectorAll('.resena__cabecera h2')).map((nodo) =>
      nodo.textContent?.trim(),
    );

    expect(nombres).toEqual(['Reportada', 'Visible']);
    expect(contenido(fixture)).toContain('1 reportada en este listado');
    expect(elemento.querySelectorAll('.resena__acciones')).toHaveLength(1);
  });

  it('aplica el filtro de estado', async () => {
    const fixture = await crear();
    accederFormulario(fixture).controls['estado'].setValue('REPORTADA');
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector('form');
    formulario?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({ estado: 'REPORTADA' });
  });

  it('muestra el estado vacío y limpia los filtros', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no hay reseñas');

    accederFormulario(fixture).controls['estado'].setValue('REPORTADA');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No encontramos reseñas');
    pulsarBoton(fixture.nativeElement, 'Limpiar filtros');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({ estado: 'TODOS' });
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener las reseñas.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([crearResena()]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar las reseñas');
    expect(contenido(fixture)).toContain('No se pudieron obtener las reseñas.');
    expect(contenido(fixture)).not.toContain('reportada en este listado');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Cliente E2E');
  });

  it('solo ofrece moderar las reseñas reportadas', async () => {
    servicio.listar.mockReturnValue(
      of([crearResena({ estado: 'REPORTADA', motivoReporte: 'Incluye datos personales.' })]),
    );
    const fixture = await crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Motivo del reporte');
    expect(texto).toContain('Incluye datos personales.');
    expect(texto).toContain('Habilitar reseña');
    expect(texto).toContain('Ocultar reseña');
  });

  it('habilita una reseña reportada y recarga el listado', async () => {
    servicio.listar.mockReturnValue(of([crearResena({ estado: 'REPORTADA' })]));
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Habilitar reseña');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      ConfirmarAccionDialog,
      expect.objectContaining({
        data: expect.objectContaining({ titulo: 'Habilitar reseña' }),
      }),
    );
    expect(servicio.moderar).toHaveBeenCalledWith(41, 'VISIBLE');
    expect(notificaciones.exito).toHaveBeenCalledWith('Reseña habilitada nuevamente.');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('oculta una reseña reportada y recarga el listado', async () => {
    servicio.listar.mockReturnValue(of([crearResena({ estado: 'REPORTADA' })]));
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ocultar reseña');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.moderar).toHaveBeenCalledWith(41, 'OCULTA');
    expect(notificaciones.exito).toHaveBeenCalledWith('Reseña ocultada del perfil público.');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('informa el error al moderar y recarga el listado', async () => {
    servicio.listar.mockReturnValue(of([crearResena({ estado: 'REPORTADA' })]));
    servicio.moderar.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'La reseña ya no puede moderarse.',
        detalles: [],
      })),
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Habilitar reseña');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(notificaciones.error).toHaveBeenCalledWith('La reseña ya no puede moderarse.');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });
});

async function crear(): Promise<ComponentFixture<AdminResenasPage>> {
  const fixture = TestBed.createComponent(AdminResenasPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function accederFormulario(fixture: ComponentFixture<AdminResenasPage>): FormGroup {
  return (fixture.componentInstance as unknown as AccesoFormulario).formularioFiltros;
}

function contenido(fixture: ComponentFixture<AdminResenasPage>): string {
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
