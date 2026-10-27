import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PerfilTecnico, PerfilUsuario } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { DistritoCatalogo, EspecialidadCatalogo } from '../../../core/catalogos/catalogo.models';
import { CatalogoService } from '../../../core/catalogos/catalogo.service';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { PerfilTecnicoService } from '../services/perfil-tecnico.service';
import { PerfilTecnicoPage } from './perfil.page';

const ESPECIALIDADES: readonly EspecialidadCatalogo[] = [
  {
    id: 1,
    nombre: 'Mantenimiento de laptops',
    descripcion: 'Limpieza y cambio de componentes.',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Redes y WiFi',
    descripcion: null,
    activo: true,
  },
];

const DISTRITOS: readonly DistritoCatalogo[] = [
  { id: 2, nombre: 'Castilla', provincia: 'Piura', topeMovilidad: 15, activo: true },
  { id: 1, nombre: 'Piura', provincia: 'Piura', topeMovilidad: 15, activo: true },
];

function crearPerfil(overrides: Partial<PerfilTecnico> = {}): PerfilUsuario {
  return {
    id: 30,
    correo: 'carlos.mena@fixtech.pe',
    rol: 'TECNICO',
    estado: 'ACTIVO',
    nombres: 'Carlos',
    apellidos: 'Mena',
    fotoUrl: null,
    tecnico: {
      id: 20,
      dni: '12345678',
      celular: '987654321',
      estadoVerificacion: 'PENDIENTE',
      motivoVerificacion: null,
      bloqueadoPorDeuda: false,
      saldoComisionPendiente: 0,
      modalidades: ['DOMICILIO', 'TALLER'],
      ofreceDomicilio: true,
      ofreceTaller: true,
      especialidades: [{ id: 1, nombre: 'Mantenimiento de laptops', activo: true }],
      distritos: [{ id: 2, nombre: 'Castilla', activo: true }],
      descripcion: 'Reparo laptops y computadoras de escritorio.',
      aniosExperiencia: 8,
      direccionTaller: 'Av. Grau 123',
      referenciaTaller: 'Frente al mercado',
      horarioTaller: 'Lunes a sábado, 9:00 a 18:00',
      garantiaDiasDefecto: 15,
      calificacionPromedio: 4.5,
      totalResenas: 7,
      serviciosCompletados: 12,
      destacado: false,
      ...overrides,
    },
  };
}

describe('PerfilTecnicoPage', () => {
  const perfil = signal<PerfilUsuario | null>(crearPerfil());
  const perfilService = {
    actualizarPerfil: vi.fn(),
    actualizarFoto: vi.fn(),
  };
  const catalogos = {
    listarEspecialidades: vi.fn(),
    listarDistritos: vi.fn(),
  };
  const notificaciones = {
    exito: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    perfil.set(crearPerfil());
    perfilService.actualizarPerfil.mockReset();
    perfilService.actualizarFoto.mockReset();
    catalogos.listarEspecialidades.mockReset();
    catalogos.listarEspecialidades.mockReturnValue(of(ESPECIALIDADES));
    catalogos.listarDistritos.mockReset();
    catalogos.listarDistritos.mockReturnValue(of(DISTRITOS));
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    notificaciones.info.mockReset();

    await TestBed.configureTestingModule({
      imports: [PerfilTecnicoPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { perfil } },
        { provide: PerfilTecnicoService, useValue: perfilService },
        { provide: CatalogoService, useValue: catalogos },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra la identidad, el perfil profesional ampliado y el estado pendiente', () => {
    const fixture = crear();

    expect(fixture.textContent).toContain('Carlos Mena');
    expect(fixture.textContent).toContain('carlos.mena@fixtech.pe');
    expect(fixture.textContent).toContain('Tu perfil está en revisión');
    expect(fixture.textContent).toContain('En revisión');
    expect(fixture.textContent).toContain('12345678');
    expect(fixture.textContent).toContain('987654321');
    expect(fixture.textContent).toContain('Reparo laptops y computadoras de escritorio.');
    expect(fixture.textContent).toContain('8 años');
    expect(fixture.textContent).toContain('15 días');
    expect(fixture.textContent).toContain('Mantenimiento de laptops');
    expect(fixture.textContent).toContain('Castilla');
    expect(fixture.textContent).toContain('Av. Grau 123');
    expect(fixture.textContent).toContain('A domicilio');
    expect(fixture.textContent).toContain('En taller');
    expect(fixture.textContent).toContain('12');
    expect(fixture.textContent).toContain('Bloqueado');
    expect(fixture.textContent).toContain('Editar perfil');
    expect(fixture.textContent).toContain('Cambiar foto');
  });

  it('muestra el motivo y la posibilidad de corregir cuando está observado', () => {
    perfil.set(
      crearPerfil({
        estadoVerificacion: 'OBSERVADO',
        motivoVerificacion: 'El DNI no coincide con el nombre registrado.',
      }),
    );
    const fixture = crear();

    expect(fixture.textContent).toContain('Tu perfil necesita correcciones');
    expect(fixture.textContent).toContain('El DNI no coincide con el nombre registrado.');
    expect(fixture.textContent).toContain('actualiza tus datos desde esta pantalla');
    expect(fixture.textContent).toContain('Observado');
  });

  it('muestra el mensaje de rechazo y el motivo indicado', () => {
    perfil.set(
      crearPerfil({
        estadoVerificacion: 'RECHAZADO',
        motivoVerificacion: 'La información del taller no pudo verificarse.',
      }),
    );
    const fixture = crear();

    expect(fixture.textContent).toContain('Tu perfil no fue aprobado');
    expect(fixture.textContent).toContain('La información del taller no pudo verificarse.');
    expect(fixture.textContent).toContain('Rechazado');
  });

  it('habilita las ofertas cuando el perfil está aprobado y sin deuda', () => {
    perfil.set(crearPerfil({ estadoVerificacion: 'APROBADO' }));
    const fixture = crear();

    expect(fixture.textContent).toContain('Tu perfil está aprobado');
    expect(fixture.textContent).toContain('Aprobado');
    expect(fixture.textContent).toContain('Habilitado');
    expect(fixture.textContent).not.toContain('bloqueo temporal por deuda');
  });

  it('muestra el bloqueo por deuda y mantiene las ofertas bloqueadas', () => {
    perfil.set(
      crearPerfil({
        estadoVerificacion: 'APROBADO',
        bloqueadoPorDeuda: true,
        saldoComisionPendiente: 25.5,
      }),
    );
    const fixture = crear();

    expect(fixture.textContent).toContain('Tienes un bloqueo temporal por deuda de comisiones.');
    expect(fixture.textContent).toContain('Saldo pendiente');
    expect(fixture.textContent).toContain('25.50');
    expect(fixture.textContent).toContain('Bloqueado');
  });

  it('abre el formulario de edición con los datos actuales y los catálogos', () => {
    const fixture = crearComponente();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement as HTMLElement, 'Editar perfil');
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Editar perfil profesional');
    expect(compilado.textContent).toContain('volverá al estado');
    expect(valor(compilado, 'input[formcontrolname="nombres"]')).toBe('Carlos');
    expect(valor(compilado, 'input[formcontrolname="dni"]')).toBe('12345678');
    expect(valor(compilado, 'input[formcontrolname="garantiaDiasDefecto"]')).toBe('15');
    expect(catalogos.listarEspecialidades).toHaveBeenCalled();
    expect(catalogos.listarDistritos).toHaveBeenCalled();
  });

  it('envía los cambios normalizados y cierra la edición', () => {
    perfilService.actualizarPerfil.mockImplementation(() => {
      const actualizado = crearPerfil({
        estadoVerificacion: 'PENDIENTE',
        descripcion: 'Especialista en redes.',
      });
      perfil.set(actualizado);
      return of(actualizado);
    });
    const fixture = crearComponente();
    fixture.detectChanges();
    pulsarBoton(fixture.nativeElement as HTMLElement, 'Editar perfil');
    fixture.detectChanges();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'input[formcontrolname="nombres"]', '  Carlos Alberto  ');
    escribir(compilado, 'textarea[formcontrolname="descripcion"]', '  Especialista en redes.  ');
    escribir(compilado, 'input[formcontrolname="garantiaDiasDefecto"]', '20');
    fixture.detectChanges();
    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    fixture.detectChanges();

    expect(perfilService.actualizarPerfil).toHaveBeenCalledWith({
      nombres: 'Carlos Alberto',
      apellidos: 'Mena',
      dni: '12345678',
      celular: '987654321',
      descripcion: 'Especialista en redes.',
      aniosExperiencia: 8,
      ofreceDomicilio: true,
      ofreceTaller: true,
      direccionTaller: 'Av. Grau 123',
      referenciaTaller: 'Frente al mercado',
      horarioTaller: 'Lunes a sábado, 9:00 a 18:00',
      garantiaDiasDefecto: 20,
      especialidadIds: [1],
      distritoIds: [2],
    });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Perfil actualizado. Tu verificación volverá a revisión.',
    );
    expect(compilado.textContent).not.toContain('Editar perfil profesional');
  });

  it('valida los campos obligatorios antes de guardar', () => {
    const fixture = crearComponente();
    fixture.detectChanges();
    pulsarBoton(fixture.nativeElement as HTMLElement, 'Editar perfil');
    fixture.detectChanges();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'input[formcontrolname="nombres"]', '');
    escribir(compilado, 'input[formcontrolname="dni"]', '123');
    escribir(compilado, 'input[formcontrolname="celular"]', '123');
    fixture.detectChanges();
    compilado.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(perfilService.actualizarPerfil).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Ingresa tus nombres.');
    expect(compilado.textContent).toContain('El DNI debe tener 8 dígitos.');
    expect(compilado.textContent).toContain('El celular debe tener 9 dígitos y empezar con 9.');
  });

  it('sube una foto válida y actualiza el perfil', () => {
    const actualizado = crearPerfil();
    perfilService.actualizarFoto.mockReturnValue(of(actualizado));
    const fixture = crearComponente();
    fixture.detectChanges();
    const compilado = fixture.nativeElement as HTMLElement;
    const archivo = new File(['imagen'], 'foto.png', { type: 'image/png' });

    seleccionarArchivo(compilado, 'input[type="file"]', archivo);
    fixture.detectChanges();

    expect(perfilService.actualizarFoto).toHaveBeenCalledWith(archivo);
    expect(notificaciones.exito).toHaveBeenCalledWith('Foto de perfil actualizada.');
  });

  it('rechaza archivos que no son JPG o PNG', () => {
    const fixture = crearComponente();
    fixture.detectChanges();
    const compilado = fixture.nativeElement as HTMLElement;
    const archivo = new File(['documento'], 'perfil.pdf', { type: 'application/pdf' });

    seleccionarArchivo(compilado, 'input[type="file"]', archivo);
    fixture.detectChanges();

    expect(perfilService.actualizarFoto).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Selecciona una imagen JPG o PNG.');
  });

  it('muestra un aviso cuando la cuenta no tiene datos de técnico', () => {
    perfil.set({ ...crearPerfil(), tecnico: null });
    const fixture = crear();

    expect(fixture.textContent).toContain(
      'No encontramos la información profesional de tu cuenta.',
    );
  });

  it('muestra el estado de carga mientras no hay perfil', () => {
    perfil.set(null);
    const fixture = crear();

    expect(fixture.textContent).toContain('Cargando tu perfil');
  });
});

function crear(): { textContent: string } {
  const fixture = crearComponente();
  fixture.detectChanges();
  return { textContent: (fixture.nativeElement as HTMLElement).textContent ?? '' };
}

function crearComponente() {
  return TestBed.createComponent(PerfilTecnicoPage);
}

function valor(contenedor: HTMLElement, selector: string): string {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  return input.value;
}

function escribir(contenedor: HTMLElement, selector: string, texto: string): void {
  const input = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = texto;
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

function seleccionarArchivo(contenedor: HTMLElement, selector: string, archivo: File): void {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([archivo], { item: (indice: number) => (indice === 0 ? archivo : null) }),
  });
  input.dispatchEvent(new Event('change'));
}
