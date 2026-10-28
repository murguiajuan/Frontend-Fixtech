import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PerfilUsuario, RecuperacionVerificadaResponse } from '../../../core/auth/auth.models';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { RecuperarPasswordPage } from './recuperar-password.page';

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

const VERIFICACION: RecuperacionVerificadaResponse = {
  ticket: 'ticket-123',
  expiraEnSegundos: 600,
};

describe('RecuperarPasswordPage', () => {
  const authStub = {
    solicitarRecuperacion: vi.fn(),
    verificarRecuperacion: vi.fn(),
    restablecerPassword: vi.fn(),
    accederConRecuperacion: vi.fn(),
  };
  const notificacionesStub = {
    exito: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    authStub.solicitarRecuperacion.mockReset();
    authStub.verificarRecuperacion.mockReset();
    authStub.restablecerPassword.mockReset();
    authStub.accederConRecuperacion.mockReset();
    notificacionesStub.exito.mockReset();
    notificacionesStub.error.mockReset();
    notificacionesStub.info.mockReset();

    await TestBed.configureTestingModule({
      imports: [RecuperarPasswordPage],
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

  it('muestra el paso de correo', () => {
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Recuperar contraseña');
    expect(compiled.querySelector('input[type="email"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-current="step"]')?.textContent).toContain('Correo');
  });

  it('valida el correo antes de solicitar el código', () => {
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.solicitarRecuperacion).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Ingresa tu correo electrónico.');
  });

  it('solicita el código y avanza al paso de verificación', () => {
    authStub.solicitarRecuperacion.mockReturnValue(
      of({ mensaje: 'Si el correo está registrado, recibirás un código de recuperación.' }),
    );
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    escribir(compiled, 'input[type="email"]', 'Cliente@FixTech.pe');
    fixture.detectChanges();

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.solicitarRecuperacion).toHaveBeenCalledWith('cliente@fixtech.pe');
    expect(compiled.textContent).toContain('Ingresa el código');
    expect(compiled.textContent).toContain('cl***@fixtech.pe');
    expect(compiled.querySelector('[aria-current="step"]')?.textContent).toContain('Código');

    const reenviar = buscarBoton(compiled, 'Reenviar');
    expect(reenviar?.disabled).toBe(true);
    expect(notificacionesStub.info).toHaveBeenCalled();
  });

  it('verifica el código y ofrece cambiar la contraseña o entrar', () => {
    authStub.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'Código enviado.' }));
    authStub.verificarRecuperacion.mockReturnValue(of(VERIFICACION));
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    avanzarACodigo(fixture, compiled);

    escribir(compiled, 'input[formcontrolname="codigo"]', '123456');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.verificarRecuperacion).toHaveBeenCalledWith('cliente@fixtech.pe', '123456');
    expect(compiled.textContent).toContain('Crear una nueva contraseña');
    expect(compiled.textContent).toContain('Entrar sin cambiar la contraseña');
    expect(compiled.textContent).toContain('10 minutos');
  });

  it('restablece la contraseña y vuelve al login', () => {
    authStub.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'Código enviado.' }));
    authStub.verificarRecuperacion.mockReturnValue(of(VERIFICACION));
    authStub.restablecerPassword.mockReturnValue(of(undefined));
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    avanzarAOpciones(fixture, compiled);

    escribir(compiled, 'input[formcontrolname="password"]', 'NuevaPassword123');
    escribir(compiled, 'input[formcontrolname="confirmarPassword"]', 'NuevaPassword123');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.restablecerPassword).toHaveBeenCalledWith('ticket-123', 'NuevaPassword123');
    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { recuperado: '1' },
    });
    expect(notificacionesStub.exito).toHaveBeenCalled();
  });

  it('entra directamente sin cambiar la contraseña', () => {
    authStub.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'Código enviado.' }));
    authStub.verificarRecuperacion.mockReturnValue(of(VERIFICACION));
    authStub.accederConRecuperacion.mockReturnValue(of(PERFIL_CLIENTE));
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    avanzarAOpciones(fixture, compiled);

    buscarBoton(compiled, 'Entrar a mi cuenta')?.click();
    fixture.detectChanges();

    expect(authStub.accederConRecuperacion).toHaveBeenCalledWith('ticket-123');
    expect(navegar).toHaveBeenCalledWith('/app/inicio');
  });

  it('muestra el error del backend cuando el código no es válido', () => {
    authStub.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'Código enviado.' }));
    authStub.verificarRecuperacion.mockReturnValue(
      throwError(() => ({
        estado: 400,
        mensaje: 'Código inválido o expirado',
        detalles: [],
      })),
    );
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    avanzarACodigo(fixture, compiled);

    escribir(compiled, 'input[formcontrolname="codigo"]', '000000');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Código inválido o expirado');
  });

  it('exige que la nueva contraseña y su confirmación coincidan', () => {
    authStub.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'Código enviado.' }));
    authStub.verificarRecuperacion.mockReturnValue(of(VERIFICACION));
    const fixture = TestBed.createComponent(RecuperarPasswordPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    avanzarAOpciones(fixture, compiled);

    escribir(compiled, 'input[formcontrolname="password"]', 'NuevaPassword123');
    escribir(compiled, 'input[formcontrolname="confirmarPassword"]', 'OtraPassword123');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStub.restablecerPassword).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Las contraseñas no coinciden.');
  });

  function avanzarACodigo(
    fixture: ComponentFixture<RecuperarPasswordPage>,
    compiled: HTMLElement,
  ): void {
    escribir(compiled, 'input[type="email"]', 'cliente@fixtech.pe');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function avanzarAOpciones(
    fixture: ComponentFixture<RecuperarPasswordPage>,
    compiled: HTMLElement,
  ): void {
    avanzarACodigo(fixture, compiled);
    escribir(compiled, 'input[formcontrolname="codigo"]', '123456');
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }
});

function escribir(contenedor: HTMLElement, selector: string, valor: string): void {
  const input = contenedor.querySelector<HTMLInputElement>(selector);
  if (input === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

function buscarBoton(contenedor: HTMLElement, texto: string): HTMLButtonElement | undefined {
  return [...contenedor.querySelectorAll('button')].find((boton) =>
    boton.textContent?.includes(texto),
  );
}
