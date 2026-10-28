import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PerfilUsuario } from '../../../core/auth/auth.models';
import { SesionExpiradaService } from '../../../core/auth/sesion-expirada.service';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { LoginPage } from './login.page';

const PERFIL_CLIENTE: PerfilUsuario = {
  id: 7,
  correo: 'cliente@fixtech.pe',
  rol: 'CLIENTE',
  estado: 'ACTIVO',
  nombres: 'Lucía',
  apellidos: 'Ramos',
  fotoUrl: null,
  tecnico: null,
};

describe('LoginPage', () => {
  const authStub = {
    iniciarSesion: vi.fn(),
  };
  const notificacionesStub = {
    exito: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    authStub.iniciarSesion.mockReset();
    notificacionesStub.exito.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotificacionService, useValue: notificacionesStub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
  });

  it('muestra el formulario de acceso', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Iniciar sesión');
    expect(compiled.querySelector('input[type="email"]')).not.toBeNull();
    expect(compiled.querySelector('input[formcontrolname="password"]')).not.toBeNull();
  });

  it('valida los campos obligatorios antes de enviar', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.iniciarSesion).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Ingresa tu correo electrónico.');
    expect(compiled.textContent).toContain('Ingresa tu contraseña.');
  });

  it('envía las credenciales y navega al panel', async () => {
    authStub.iniciarSesion.mockReturnValue(of(PERFIL_CLIENTE));
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    escribir(compiled, 'input[type="email"]', 'cliente@fixtech.pe');
    escribir(compiled, 'input[formcontrolname="password"]', 'Password123');
    fixture.detectChanges();

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authStub.iniciarSesion).toHaveBeenCalledWith({
      correo: 'cliente@fixtech.pe',
      password: 'Password123',
    });
    expect(navegar).toHaveBeenCalledWith('/app/inicio');
  });

  it('muestra el mensaje de error del servidor', () => {
    authStub.iniciarSesion.mockReturnValue(
      throwError(() => ({
        estado: 401,
        mensaje: 'Credenciales inválidas',
        detalles: [],
      })),
    );
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    escribir(compiled, 'input[type="email"]', 'cliente@fixtech.pe');
    escribir(compiled, 'input[formcontrolname="password"]', 'incorrecta');
    fixture.detectChanges();

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Credenciales inválidas');
  });

  it('muestra el aviso accesible cuando la URL indica que la sesión expiró', () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: { queryParamMap: convertToParamMap({ sesion: 'expirada' }) },
      },
    });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const aviso = compiled.querySelector('[role="alert"]');
    expect(aviso?.textContent).toContain('Tu sesión expiró por seguridad.');
  });

  it('muestra el aviso cuando el servicio de sesión expirada lo registró', () => {
    TestBed.inject(SesionExpiradaService).marcarExpirada();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Tu sesión expiró por seguridad.');
  });

  it('no muestra el aviso de expiración en un acceso normal', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).not.toContain('Tu sesión expiró por seguridad.');
  });
});

function escribir(contenedor: HTMLElement, selector: string, valor: string): void {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}
