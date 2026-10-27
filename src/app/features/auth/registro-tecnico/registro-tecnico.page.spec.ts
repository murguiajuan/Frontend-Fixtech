import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { DistritoCatalogo, EspecialidadCatalogo } from '../../../core/catalogos/catalogo.models';
import { CatalogoService } from '../../../core/catalogos/catalogo.service';
import { RegistroTecnicoPage } from './registro-tecnico.page';

const ESPECIALIDADES: readonly EspecialidadCatalogo[] = [
  {
    id: 1,
    nombre: 'Mantenimiento de laptops',
    descripcion: 'Limpieza y cambio de componentes.',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Redes y WiFi',
    descripcion: null,
    activo: true,
  },
];

const DISTRITOS: readonly DistritoCatalogo[] = [
  { id: 1, nombre: 'Piura', provincia: 'Piura', topeMovilidad: 15, activo: true },
  { id: 2, nombre: 'Castilla', provincia: 'Piura', topeMovilidad: 15, activo: true },
];

describe('RegistroTecnicoPage', () => {
  const authStub = {
    registrarTecnico: vi.fn(),
  };
  const catalogoStub = {
    listarEspecialidades: vi.fn(),
    listarDistritos: vi.fn(),
  };

  beforeEach(async () => {
    authStub.registrarTecnico.mockReset();
    authStub.registrarTecnico.mockReturnValue(
      of({ id: 30, correo: 'carlos.mena@fixtech.pe', rol: 'TECNICO' }),
    );
    catalogoStub.listarEspecialidades.mockReset();
    catalogoStub.listarEspecialidades.mockReturnValue(of(ESPECIALIDADES));
    catalogoStub.listarDistritos.mockReset();
    catalogoStub.listarDistritos.mockReturnValue(of(DISTRITOS));

    await TestBed.configureTestingModule({
      imports: [RegistroTecnicoPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CatalogoService, useValue: catalogoStub },
      ],
    }).compileComponents();
  });

  it('carga especialidades y distritos desde los catálogos públicos', () => {
    const { compilado } = crear();

    expect(catalogoStub.listarEspecialidades).toHaveBeenCalled();
    expect(catalogoStub.listarDistritos).toHaveBeenCalled();
    expect(compilado.textContent).toContain('Mantenimiento de laptops');
    expect(compilado.textContent).toContain('Redes y WiFi');
    expect(compilado.textContent).toContain('Piura');
    expect(compilado.textContent).toContain('Castilla');
    expect(compilado.querySelector('#especialidad-1 input')).not.toBeNull();
    expect(compilado.querySelector('#distrito-1 input')).not.toBeNull();
  });

  it('valida los campos obligatorios y la selección de catálogos antes de enviar', () => {
    const { fixture, compilado } = crear();

    enviar(fixture);
    fixture.detectChanges();

    expect(authStub.registrarTecnico).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Ingresa tus nombres.');
    expect(compilado.textContent).toContain('Ingresa tu correo electrónico.');
    expect(compilado.textContent).toContain('Ingresa tu DNI.');
    expect(compilado.textContent).toContain('Selecciona al menos una especialidad.');
    expect(compilado.textContent).toContain('Selecciona al menos un distrito de cobertura.');
    expect(compilado.textContent).toContain(
      'Debes aceptar los términos y condiciones para continuar.',
    );
  });

  it('exige al menos una modalidad de atención', () => {
    const { fixture, compilado } = crear();
    marcar(compilado, '#ofrece-domicilio input', false);

    enviar(fixture);
    fixture.detectChanges();

    expect(authStub.registrarTecnico).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Selecciona al menos una modalidad de atención.');
  });

  it('rechaza años de experiencia con decimales', () => {
    const { fixture, compilado } = crear();
    escribir(compilado, 'input[formcontrolname="aniosExperiencia"]', '5.5');

    enviar(fixture);
    fixture.detectChanges();

    expect(authStub.registrarTecnico).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Los años de experiencia deben ser un número entero.');
  });

  it('exige la dirección del taller cuando se ofrece atención en taller', () => {
    const { fixture, compilado } = crear();
    marcar(compilado, '#ofrece-taller input', true);
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Dirección del taller');

    enviar(fixture);
    fixture.detectChanges();

    expect(authStub.registrarTecnico).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('Ingresa la dirección del taller.');
  });

  it('envía los datos normalizados y redirige al login', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const { fixture, compilado } = crear();

    escribir(compilado, 'input[formcontrolname="nombres"]', '  Carlos  ');
    escribir(compilado, 'input[formcontrolname="apellidos"]', '  Mena  ');
    escribir(compilado, 'input[formcontrolname="correo"]', '  Carlos.Mena@FixTech.pe  ');
    escribir(compilado, 'input[formcontrolname="celular"]', '987654321');
    escribir(compilado, 'input[formcontrolname="dni"]', '12345678');
    escribir(compilado, 'input[formcontrolname="password"]', 'Password123');
    escribir(compilado, 'input[formcontrolname="confirmarPassword"]', 'Password123');
    escribir(
      compilado,
      'textarea[formcontrolname="descripcion"]',
      '  Reparo laptops y computadoras.  ',
    );
    escribir(compilado, 'input[formcontrolname="aniosExperiencia"]', '8');
    marcar(compilado, '#ofrece-taller input', true);
    fixture.detectChanges();
    escribir(compilado, 'input[formcontrolname="direccionTaller"]', '  Av. Grau 123  ');
    escribir(compilado, 'input[formcontrolname="referenciaTaller"]', '  Frente al mercado  ');
    escribir(
      compilado,
      'input[formcontrolname="horarioTaller"]',
      '  Lunes a sábado, 9:00 a 18:00  ',
    );
    marcar(compilado, '#especialidad-1 input', true);
    marcar(compilado, '#distrito-1 input', true);
    marcar(compilado, '#acepto-terminos input', true);
    fixture.detectChanges();

    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authStub.registrarTecnico).toHaveBeenCalledWith({
      nombres: 'Carlos',
      apellidos: 'Mena',
      correo: 'carlos.mena@fixtech.pe',
      celular: '987654321',
      dni: '12345678',
      password: 'Password123',
      aceptoTerminos: true,
      descripcion: 'Reparo laptops y computadoras.',
      aniosExperiencia: 8,
      ofreceDomicilio: true,
      ofreceTaller: true,
      direccionTaller: 'Av. Grau 123',
      referenciaTaller: 'Frente al mercado',
      horarioTaller: 'Lunes a sábado, 9:00 a 18:00',
      especialidadIds: [1],
      distritoIds: [1],
    });
    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { registrado: 'tecnico' },
    });
  });

  it('muestra el error del servidor sin redirigir', () => {
    authStub.registrarTecnico.mockReturnValue(
      throwError(() => ({
        estado: 409,
        mensaje: 'El DNI ya está registrado',
        detalles: [],
      })),
    );
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const { fixture, compilado } = crear();
    completarFormularioValido(compilado, fixture);

    enviar(fixture);
    fixture.detectChanges();

    expect(compilado.textContent).toContain('El DNI ya está registrado');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('muestra el error de catálogos y permite reintentar', async () => {
    catalogoStub.listarEspecialidades
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'El catálogo no está disponible.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(ESPECIALIDADES));
    catalogoStub.listarDistritos
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'El catálogo no está disponible.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(DISTRITOS));
    const { fixture, compilado } = crear();

    expect(compilado.textContent).toContain('El catálogo no está disponible.');
    expect(compilado.textContent).toContain('Reintentar');

    pulsarBoton(compilado, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Mantenimiento de laptops');
    expect(compilado.textContent).toContain('Castilla');
  });

  it('muestra un estado vacío cuando el catálogo de especialidades no tiene datos', () => {
    catalogoStub.listarEspecialidades.mockReturnValue(of([]));
    const { compilado } = crear();

    expect(compilado.textContent).toContain('No hay especialidades disponibles por el momento.');
  });
});

function crear(): { fixture: ComponentFixture<RegistroTecnicoPage>; compilado: HTMLElement } {
  const fixture = TestBed.createComponent(RegistroTecnicoPage);
  fixture.detectChanges();
  return { fixture, compilado: fixture.nativeElement as HTMLElement };
}

function enviar(fixture: ComponentFixture<RegistroTecnicoPage>): void {
  fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
}

function completarFormularioValido(
  compilado: HTMLElement,
  fixture: ComponentFixture<RegistroTecnicoPage>,
): void {
  escribir(compilado, 'input[formcontrolname="nombres"]', 'Carlos');
  escribir(compilado, 'input[formcontrolname="apellidos"]', 'Mena');
  escribir(compilado, 'input[formcontrolname="correo"]', 'carlos.mena@fixtech.pe');
  escribir(compilado, 'input[formcontrolname="celular"]', '987654321');
  escribir(compilado, 'input[formcontrolname="dni"]', '12345678');
  escribir(compilado, 'input[formcontrolname="password"]', 'Password123');
  escribir(compilado, 'input[formcontrolname="confirmarPassword"]', 'Password123');
  escribir(compilado, 'input[formcontrolname="aniosExperiencia"]', '8');
  marcar(compilado, '#especialidad-1 input', true);
  marcar(compilado, '#distrito-1 input', true);
  marcar(compilado, '#acepto-terminos input', true);
  fixture.detectChanges();
}

function escribir(contenedor: HTMLElement, selector: string, valor: string): void {
  const campo = contenedor.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (campo === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

function marcar(contenedor: HTMLElement, selector: string, marcado: boolean): void {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el checkbox ${selector}`);
  }
  if (input.checked !== marcado) {
    input.click();
  }
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const boton = [...contenedor.querySelectorAll('button')].find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
