import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PerfilTecnico, PerfilUsuario } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PerfilTecnicoPage } from './perfil.page';

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
      estadoVerificacion: 'PENDIENTE',
      motivoVerificacion: null,
      bloqueadoPorDeuda: false,
      saldoComisionPendiente: 0,
      modalidades: ['DOMICILIO', 'TALLER'],
      descripcion: 'Reparo laptops y computadoras de escritorio.',
      aniosExperiencia: 8,
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

  beforeEach(async () => {
    perfil.set(crearPerfil());
    await TestBed.configureTestingModule({
      imports: [PerfilTecnicoPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: { perfil } }],
    }).compileComponents();
  });

  it('muestra la identidad, el perfil profesional y el estado pendiente', () => {
    const fixture = crear();

    expect(fixture.textContent).toContain('Carlos Mena');
    expect(fixture.textContent).toContain('carlos.mena@fixtech.pe');
    expect(fixture.textContent).toContain('Tu perfil está en revisión');
    expect(fixture.textContent).toContain('En revisión');
    expect(fixture.textContent).toContain('Reparo laptops y computadoras de escritorio.');
    expect(fixture.textContent).toContain('8 años');
    expect(fixture.textContent).toContain('A domicilio');
    expect(fixture.textContent).toContain('En taller');
    expect(fixture.textContent).toContain('12');
    expect(fixture.textContent).toContain('Bloqueado');
  });

  it('muestra el motivo cuando el perfil está observado', () => {
    perfil.set(
      crearPerfil({
        estadoVerificacion: 'OBSERVADO',
        motivoVerificacion: 'El DNI no coincide con el nombre registrado.',
      }),
    );
    const fixture = crear();

    expect(fixture.textContent).toContain('Tu perfil necesita correcciones');
    expect(fixture.textContent).toContain('El DNI no coincide con el nombre registrado.');
    expect(fixture.textContent).toContain('Observado');
    expect(fixture.textContent).toContain('La edición de datos desde la aplicación');
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

  it('indica que el perfil es de solo lectura', () => {
    const fixture = crear();

    expect(fixture.textContent).toContain('Solo lectura');
    expect(fixture.textContent).toContain(
      'La edición de datos, foto y documentos de verificación no está disponible',
    );
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
  const fixture = TestBed.createComponent(PerfilTecnicoPage);
  fixture.detectChanges();
  return { textContent: (fixture.nativeElement as HTMLElement).textContent ?? '' };
}
