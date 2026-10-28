import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ConfirmarAccionDialog } from '../../../shared/ui/confirmar-accion-dialog';
import { Reclamo } from '../../servicios/servicio.models';
import { crearReclamo } from '../../servicios/testing/servicio.fixtures';
import { AdminReclamosService } from '../services/admin-reclamos.service';
import { ResolucionReclamoDialog } from './resolucion-reclamo-dialog';
import { AdminReclamosPage } from './reclamos.page';

interface AccesoFormulario {
  readonly formularioFiltros: FormGroup;
}

describe('AdminReclamosPage', () => {
  const servicio = {
    listar: vi.fn(),
    obtener: vi.fn(),
    cambiarEstado: vi.fn(),
    urlFoto: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  const crearUrl = vi.fn(() => 'blob:reclamo-admin');
  const revocarUrl = vi.fn();
  const crearOriginal = URL.createObjectURL;
  const revocarOriginal = URL.revokeObjectURL;
  let http: HttpTestingController;

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of([crearReclamo()] as readonly Reclamo[]));
    servicio.obtener.mockReset();
    servicio.obtener.mockReturnValue(of(crearReclamo()));
    servicio.cambiarEstado.mockReset();
    servicio.cambiarEstado.mockReturnValue(of(crearReclamo({ estado: 'EN_REVISION' })));
    servicio.urlFoto.mockReset();
    servicio.urlFoto.mockReturnValue('/api/admin/reclamos/51/fotos/201');
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarUrl,
    });

    await TestBed.configureTestingModule({
      imports: [AdminReclamosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminReclamosService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http
      .match((solicitud) => solicitud.url.includes('/fotos/'))
      .forEach((solicitud) => solicitud.flush(new Blob(['imagen'], { type: 'image/png' })));
    http.verify();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearOriginal,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarOriginal,
    });
  });

  it('carga y muestra los reclamos con su estado', async () => {
    const fixture = await crear();

    expect(servicio.listar).toHaveBeenCalledWith({ estado: 'TODOS' });
    const texto = contenido(fixture);
    expect(texto).toContain('Reclamo #51');
    expect(texto).toContain('Servicio #21 · Cliente E2E');
    expect(texto).toContain('Abierto');
    expect(texto).toContain('El equipo regresó con la misma falla al día siguiente.');
  });

  it('aplica el filtro de estado', async () => {
    const fixture = await crear();
    accederFormulario(fixture).controls['estado'].setValue('EN_REVISION');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({ estado: 'EN_REVISION' });
  });

  it('muestra el estado vacío y limpia los filtros', async () => {
    servicio.listar.mockReturnValue(of([]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no hay reclamos');

    accederFormulario(fixture).controls['estado'].setValue('CERRADO');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No encontramos reclamos');
    pulsarBoton(fixture.nativeElement, 'Limpiar filtros');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({ estado: 'TODOS' });
  });

  it('muestra el error del listado y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener los reclamos.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([crearReclamo()]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar los reclamos');
    expect(contenido(fixture)).toContain('No se pudieron obtener los reclamos.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Reclamo #51');
  });

  it('expande el detalle con fotos y respuesta del técnico', async () => {
    servicio.obtener.mockReturnValue(
      of(
        crearReclamo({
          respuestaTecnico: 'Revisamos el equipo y coordinamos la devolución.',
        }),
      ),
    );
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    http
      .expectOne('http://localhost:8082/api/admin/reclamos/51/fotos/201')
      .flush(new Blob(['imagen'], { type: 'image/png' }));
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(servicio.obtener).toHaveBeenCalledWith(51);
    expect(servicio.urlFoto).toHaveBeenCalledWith(51, 201);
    expect(texto).toContain('Detalle del reclamo');
    expect(texto).toContain('Revisamos el equipo y coordinamos la devolución.');
    expect(texto).toContain('Iniciar revisión');
    const imagen = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(imagen?.getAttribute('alt')).toBe('Foto del reclamo 51');
  });

  it('muestra el error al cargar el detalle', async () => {
    servicio.obtener.mockReturnValue(
      throwError(() => ({
        estado: 500,
        mensaje: 'No se pudo obtener el detalle.',
        detalles: [],
      })),
    );
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No se pudo obtener el detalle.');
  });

  it('inicia la revisión de un reclamo abierto', async () => {
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();
    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Iniciar revisión');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      ConfirmarAccionDialog,
      expect.objectContaining({
        data: expect.objectContaining({ titulo: 'Iniciar revisión del reclamo #51' }),
      }),
    );
    expect(servicio.cambiarEstado).toHaveBeenCalledWith(51, {
      estado: 'EN_REVISION',
      resolucion: null,
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('El reclamo pasó a revisión.');
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('resuelve un reclamo en revisión con la resolución indicada', async () => {
    const enRevision = crearReclamo({ estado: 'EN_REVISION' });
    servicio.listar.mockReturnValue(of([enRevision]));
    servicio.obtener.mockReturnValue(of(enRevision));
    servicio.cambiarEstado.mockReturnValue(
      of(crearReclamo({ estado: 'RESUELTO', resolucion: 'Se reemplazó el repuesto.' })),
    );
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ resolucion: 'Se reemplazó el repuesto.' }),
    });
    const fixture = await crear();
    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Resolver reclamo');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      ResolucionReclamoDialog,
      expect.objectContaining({
        data: { estado: 'RESUELTO', resolucionActual: '' },
      }),
    );
    expect(servicio.cambiarEstado).toHaveBeenCalledWith(51, {
      estado: 'RESUELTO',
      resolucion: 'Se reemplazó el repuesto.',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Reclamo resuelto. Se notificó a las partes.',
    );
  });

  it('cierra un reclamo resuelto y muestra el estado final', async () => {
    const resuelto = crearReclamo({
      estado: 'RESUELTO',
      resolucion: 'Se reemplazó el repuesto.',
    });
    servicio.listar.mockReturnValue(of([resuelto]));
    servicio.obtener.mockReturnValue(of(resuelto));
    servicio.cambiarEstado.mockReturnValue(
      of(crearReclamo({ estado: 'CERRADO', resolucion: 'Se reemplazó el repuesto.' })),
    );
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ resolucion: 'Se reemplazó el repuesto.' }),
    });
    const fixture = await crear();
    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Cerrar reclamo');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.cambiarEstado).toHaveBeenCalledWith(51, {
      estado: 'CERRADO',
      resolucion: 'Se reemplazó el repuesto.',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('Reclamo cerrado.');
  });

  it('no ofrece acciones cuando el reclamo está cerrado', async () => {
    const cerrado = crearReclamo({ estado: 'CERRADO', resolucion: 'Caso cerrado.' });
    servicio.listar.mockReturnValue(of([cerrado]));
    servicio.obtener.mockReturnValue(of(cerrado));
    const fixture = await crear();
    pulsarBoton(fixture.nativeElement, 'Ver detalle');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(texto).toContain('El reclamo está cerrado y no admite más cambios de estado.');
    expect(texto).not.toContain('Cerrar reclamo');
    expect(texto).not.toContain('Resolver reclamo');
  });
});

async function crear(): Promise<ComponentFixture<AdminReclamosPage>> {
  const fixture = TestBed.createComponent(AdminReclamosPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function accederFormulario(fixture: ComponentFixture<AdminReclamosPage>): FormGroup {
  return (fixture.componentInstance as unknown as AccesoFormulario).formularioFiltros;
}

function contenido(fixture: ComponentFixture<AdminReclamosPage>): string {
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
