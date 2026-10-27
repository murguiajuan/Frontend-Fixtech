import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogoService } from '../../../../core/catalogos/catalogo.service';
import { CatalogoSimple, DistritoCatalogo } from '../../../../core/catalogos/catalogo.models';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudDetalle } from '../solicitud.models';
import { SolicitudFormPage } from './solicitud-form.page';

const TIPOS_EQUIPO: readonly CatalogoSimple[] = [
  { id: 1, nombre: 'Laptop', activo: true },
  { id: 2, nombre: 'Impresora', activo: false },
];

const TIPOS_SERVICIO: readonly CatalogoSimple[] = [
  { id: 2, nombre: 'Diagnóstico y reparación', activo: true },
];

const DISTRITOS: readonly DistritoCatalogo[] = [
  { id: 3, nombre: 'Piura', provincia: 'Piura', topeMovilidad: 15, activo: true },
  { id: 4, nombre: 'Castilla', provincia: 'Piura', topeMovilidad: 15, activo: false },
];

const SOLICITUD: SolicitudDetalle = {
  id: 15,
  estado: 'PUBLICADA',
  urgencia: 'MEDIA',
  modalidad: 'DOMICILIO',
  tipoEquipoId: 1,
  tipoServicioId: 2,
  distritoId: 3,
  tipoEquipo: 'Laptop',
  tipoServicio: 'Diagnóstico y reparación',
  distrito: 'Piura',
  marca: 'Lenovo',
  modelo: 'ThinkPad',
  descripcion: 'La laptop no enciende.',
  direccion: 'Av. Grau 123',
  referencia: null,
  fechaPreferida: null,
  horarioPreferido: null,
  presupuestoReferencial: 150,
  fechaVencimiento: '2026-11-03T10:00:00',
  motivoCancelacion: null,
  creadoEn: '2026-10-27T10:00:00',
  imagenPrincipalUrl: null,
  imagenes: [],
};

interface AccesoFormulario {
  readonly formulario: FormGroup;
}

describe('SolicitudFormPage', () => {
  const solicitudes = {
    crear: vi.fn(),
    actualizar: vi.fn(),
    obtener: vi.fn(),
  };
  const catalogos = {
    listarTiposEquipo: vi.fn(),
    listarTiposServicio: vi.fn(),
    listarDistritos: vi.fn(),
  };
  const notificaciones = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };
  let navegacion: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    solicitudes.crear.mockReset();
    solicitudes.actualizar.mockReset();
    solicitudes.obtener.mockReset();
    catalogos.listarTiposEquipo.mockReset();
    catalogos.listarTiposEquipo.mockReturnValue(of(TIPOS_EQUIPO));
    catalogos.listarTiposServicio.mockReset();
    catalogos.listarTiposServicio.mockReturnValue(of(TIPOS_SERVICIO));
    catalogos.listarDistritos.mockReset();
    catalogos.listarDistritos.mockReturnValue(of(DISTRITOS));
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    notificaciones.info.mockReset();

    await TestBed.configureTestingModule({
      imports: [SolicitudFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SolicitudesService, useValue: solicitudes },
        { provide: CatalogoService, useValue: catalogos },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();

    navegacion = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    navegacion.mockRestore();
  });

  it('carga los catálogos y muestra el formulario de creación', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(catalogos.listarTiposEquipo).toHaveBeenCalled();
    expect(catalogos.listarTiposServicio).toHaveBeenCalled();
    expect(catalogos.listarDistritos).toHaveBeenCalled();
    expect(compilado.textContent).toContain('Nueva solicitud');
    expect(compilado.textContent).toContain('Fotos del equipo');
    expect(compilado.textContent).toContain('Aún no has agregado fotos');
    expect(compilado.textContent).toContain('Publicar solicitud');
  });

  it('valida los campos obligatorios y exige al menos una foto', async () => {
    const fixture = await crear();
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Publicar solicitud');
    fixture.detectChanges();

    expect(solicitudes.crear).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Selecciona el tipo de equipo.');
    expect(compilado.textContent).toContain('Selecciona el tipo de servicio.');
    expect(compilado.textContent).toContain('Describe el problema o servicio que necesitas.');
    expect(compilado.textContent).toContain('Selecciona el distrito de atención.');
    expect(compilado.textContent).toContain('Ingresa la dirección para la atención a domicilio.');
  });

  it('exige una foto cuando los datos son válidos', async () => {
    const fixture = await crear();
    rellenarFormularioValido(fixture);

    pulsarBoton(fixture.nativeElement, 'Publicar solicitud');
    fixture.detectChanges();

    expect(solicitudes.crear).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Adjunta al menos una foto del equipo.',
    );
  });

  it('publica la solicitud con los datos normalizados y las fotos', async () => {
    solicitudes.crear.mockReturnValue(of(SOLICITUD));
    const fixture = await crear();
    rellenarFormularioValido(fixture);
    const archivo = new File(['imagen'], 'equipo.png', { type: 'image/png' });
    seleccionarArchivos(fixture.nativeElement, [archivo]);
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Publicar solicitud');
    fixture.detectChanges();

    expect(solicitudes.crear).toHaveBeenCalledWith(
      {
        tipoEquipoId: 1,
        tipoServicioId: 2,
        marca: 'Lenovo',
        modelo: null,
        descripcion: 'No enciende.',
        urgencia: 'ALTA',
        modalidad: 'TALLER',
        distritoId: 3,
        direccion: null,
        referencia: null,
        fechaPreferida: null,
        horarioPreferido: null,
        presupuestoReferencial: 200,
      },
      [archivo],
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Solicitud publicada.');
    expect(navegacion).toHaveBeenCalledWith(['/app/cliente/solicitudes', 15]);
  });

  it('rechaza fotos que no sean JPG o PNG y las que superan 5 MB', async () => {
    const fixture = await crear();
    const pdf = new File(['documento'], 'equipo.pdf', { type: 'application/pdf' });
    const grande = new File(['imagen'], 'grande.png', { type: 'image/png' });
    Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });

    seleccionarArchivos(fixture.nativeElement, [pdf, grande]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('equipo.pdf: solo se permiten imágenes JPG o PNG.');
    expect(texto).toContain('grande.png: la imagen supera los 5 MB.');
  });

  it('limita la selección a cinco fotos', async () => {
    const fixture = await crear();
    const archivos = Array.from(
      { length: 6 },
      (_valor, indice) => new File(['imagen'], `equipo-${indice + 1}.png`, { type: 'image/png' }),
    );

    seleccionarArchivos(fixture.nativeElement, archivos);
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Puedes adjuntar como máximo 5 fotos.');
    expect(compilado.querySelectorAll('.solicitud-form__foto')).toHaveLength(5);
  });

  it('permite quitar una foto seleccionada', async () => {
    const fixture = await crear();
    const archivos = [
      new File(['imagen'], 'uno.png', { type: 'image/png' }),
      new File(['imagen'], 'dos.png', { type: 'image/png' }),
    ];
    seleccionarArchivos(fixture.nativeElement, archivos);
    fixture.detectChanges();
    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelectorAll('.solicitud-form__foto')).toHaveLength(2);

    pulsarBotonAria(compilado, 'Quitar uno.png');
    fixture.detectChanges();

    expect(compilado.querySelectorAll('.solicitud-form__foto')).toHaveLength(1);
    expect(compilado.textContent).toContain('dos.png');
    expect(compilado.textContent).not.toContain('uno.png');
  });

  it('carga la solicitud en modo edición y actualiza solo los datos', async () => {
    solicitudes.obtener.mockReturnValue(of(SOLICITUD));
    solicitudes.actualizar.mockReturnValue(of(SOLICITUD));
    const fixture = crearEdicion('15');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(solicitudes.obtener).toHaveBeenCalledWith(15);
    expect(compilado.textContent).toContain('Editar solicitud');
    expect(valor(compilado, 'input[formcontrolname="marca"]')).toBe('Lenovo');
    expect(valor(compilado, 'textarea[formcontrolname="descripcion"]')).toBe(
      'La laptop no enciende.',
    );
    expect(compilado.textContent).not.toContain('Fotos del equipo');

    escribir(compilado, 'input[formcontrolname="marca"]', '  HP  ');
    fixture.detectChanges();
    pulsarBoton(compilado, 'Guardar cambios');
    fixture.detectChanges();

    expect(solicitudes.actualizar).toHaveBeenCalledWith(15, {
      tipoEquipoId: 1,
      tipoServicioId: 2,
      marca: 'HP',
      modelo: 'ThinkPad',
      descripcion: 'La laptop no enciende.',
      urgencia: 'MEDIA',
      modalidad: 'DOMICILIO',
      distritoId: 3,
      direccion: 'Av. Grau 123',
      referencia: null,
      fechaPreferida: null,
      horarioPreferido: null,
      presupuestoReferencial: 150,
    });
    expect(solicitudes.crear).not.toHaveBeenCalled();
    expect(navegacion).toHaveBeenCalledWith(['/app/cliente/solicitudes', 15]);
  });

  it('bloquea la edición cuando la solicitud ya no está publicada', async () => {
    solicitudes.obtener.mockReturnValue(of({ ...SOLICITUD, estado: 'ACEPTADA' }));
    const fixture = crearEdicion('15');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Esta solicitud ya no se puede editar');
    expect(compilado.textContent).not.toContain('Guardar cambios');
    expect(compilado.querySelector('form')).toBeNull();
  });

  it('muestra el error al cargar la solicitud y permite reintentar', async () => {
    solicitudes.obtener.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { mensaje: 'No se encontró la solicitud.' },
          }),
      ),
    );
    const fixture = crearEdicion('15');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('No pudimos cargar la solicitud');
    expect(compilado.textContent).toContain('No se encontró la solicitud.');

    solicitudes.obtener.mockReturnValue(of(SOLICITUD));
    pulsarBoton(compilado, 'Reintentar');
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Editar solicitud');
  });

  it('muestra los errores de la API al guardar', async () => {
    solicitudes.crear.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              mensaje: 'No se pudo publicar la solicitud.',
              detalles: ['La foto está dañada.'],
            },
          }),
      ),
    );
    const fixture = await crear();
    rellenarFormularioValido(fixture);
    seleccionarArchivos(fixture.nativeElement, [
      new File(['imagen'], 'equipo.png', { type: 'image/png' }),
    ]);
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Publicar solicitud');
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('No se pudo publicar la solicitud.');
    expect(compilado.textContent).toContain('La foto está dañada.');
    expect(navegacion).not.toHaveBeenCalled();
  });

  it('rechaza fechas preferidas anteriores a hoy', async () => {
    const fixture = await crear();
    const formulario = accederFormulario(fixture);
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    formulario.patchValue({ fechaPreferida: ayer.toISOString().slice(0, 10) });
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Publicar solicitud');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'La fecha preferida no puede ser anterior a hoy.',
    );
    expect(solicitudes.crear).not.toHaveBeenCalled();
  });

  it('muestra el error de catálogos y bloquea el envío', async () => {
    catalogos.listarDistritos.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { mensaje: 'No se pudo cargar el catálogo.' },
          }),
      ),
    );
    const fixture = await crear();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('No se pudo cargar el catálogo.');
    const boton = buscarBoton(compilado, 'Publicar solicitud');
    expect(boton.disabled).toBe(true);
  });
});

async function crear(): Promise<ComponentFixture<SolicitudFormPage>> {
  const fixture = TestBed.createComponent(SolicitudFormPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function crearEdicion(id: string): ComponentFixture<SolicitudFormPage> {
  const fixture = TestBed.createComponent(SolicitudFormPage);
  fixture.componentRef.setInput('id', id);
  return fixture;
}

function accederFormulario(fixture: ComponentFixture<SolicitudFormPage>): FormGroup {
  return (fixture.componentInstance as unknown as AccesoFormulario).formulario;
}

function rellenarFormularioValido(fixture: ComponentFixture<SolicitudFormPage>): void {
  accederFormulario(fixture).patchValue({
    tipoEquipoId: 1,
    tipoServicioId: 2,
    marca: '  Lenovo  ',
    descripcion: '  No enciende.  ',
    urgencia: 'ALTA',
    modalidad: 'TALLER',
    distritoId: 3,
    presupuestoReferencial: 200,
  });
  fixture.detectChanges();
}

function seleccionarArchivos(contenedor: HTMLElement, archivos: readonly File[]): void {
  const input = contenedor.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error('No se encontró el campo de fotos');
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([...archivos], {
      item: (indice: number) => archivos[indice] ?? null,
    }),
  });
  input.dispatchEvent(new Event('change'));
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const input = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = texto;
  input.dispatchEvent(new Event('input'));
}

function valor(contenedor: HTMLElement, selector: string): string {
  const input = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  return input.value;
}

function buscarBoton(contenedor: HTMLElement, texto: string): HTMLButtonElement {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  return boton;
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  buscarBoton(contenedor, texto).click();
}

function pulsarBotonAria(contenedor: HTMLElement, etiqueta: string): void {
  const boton = Array.from(contenedor.querySelectorAll('button')).find(
    (elemento) => elemento.getAttribute('aria-label') === etiqueta,
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón con aria-label ${etiqueta}`);
  }
  boton.click();
}
