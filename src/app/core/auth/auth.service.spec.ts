import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { PerfilUsuario, RegistroTecnicoRequest } from './auth.models';
import { SessionStore } from './session-store.service';

const TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiraEnSegundos: 900,
} as const;

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

const PERFIL_TECNICO_PENDIENTE: PerfilUsuario = {
  id: 8,
  correo: 'tecnico@fixtech.pe',
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
    modalidades: ['DOMICILIO'],
    ofreceDomicilio: true,
    ofreceTaller: false,
    especialidades: [],
    distritos: [],
    descripcion: null,
    aniosExperiencia: 8,
    direccionTaller: null,
    referenciaTaller: null,
    horarioTaller: null,
    garantiaDiasDefecto: 7,
    calificacionPromedio: 4.5,
    totalResenas: 4,
    serviciosCompletados: 9,
    destacado: false,
  },
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    http.verify();
  });

  it('inicia sesión, guarda los tokens y carga el perfil', () => {
    let perfil: PerfilUsuario | undefined;
    auth
      .iniciarSesion({ correo: 'cliente@fixtech.pe', password: 'Password123' })
      .subscribe((resultado) => {
        perfil = resultado;
      });

    const login = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({
      correo: 'cliente@fixtech.pe',
      password: 'Password123',
    });
    login.flush(TOKENS);

    const me = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(me.request.method).toBe('GET');
    me.flush(PERFIL_CLIENTE);

    expect(perfil).toEqual(PERFIL_CLIENTE);
    expect(session.accessToken()).toBe('access-token');
    expect(auth.rol()).toBe('CLIENTE');
    expect(auth.autenticado()).toBe(true);
  });

  it('actualiza el perfil en memoria después de una edición', () => {
    session.guardar(TOKENS);
    auth.cargarPerfil().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(PERFIL_CLIENTE);

    const actualizado: PerfilUsuario = { ...PERFIL_CLIENTE, nombres: 'Lucía Elena' };
    auth.actualizarPerfil(actualizado);

    expect(auth.perfil()).toEqual(actualizado);
    expect(auth.nombreCompleto()).toBe('Lucía Elena Ramos');
  });

  it('no carga el perfil si no hay sesión', async () => {
    const tieneSesion = await new Promise<boolean>((resolve) => {
      auth.asegurarSesion().subscribe(resolve);
    });

    expect(tieneSesion).toBe(false);
    http.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('bloquea las ofertas de un técnico pendiente de verificación', () => {
    session.guardar(TOKENS);
    auth.cargarPerfil().subscribe();

    http.expectOne(`${environment.apiUrl}/auth/me`).flush(PERFIL_TECNICO_PENDIENTE);

    expect(auth.esTecnicoAprobado()).toBe(false);
    expect(auth.puedeOfertar()).toBe(false);
  });

  it('limpia la sesión cuando el perfil no se puede cargar', () => {
    session.guardar(TOKENS);
    let fallo = false;
    auth.cargarPerfil().subscribe({
      error: () => {
        fallo = true;
      },
    });

    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ mensaje: 'Token inválido' }, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    expect(session.tieneSesion()).toBe(false);
    expect(auth.perfil()).toBeNull();
  });

  it('oculta el perfil y rechaza la sesión cuando los tokens se limpian por fuera', async () => {
    session.guardar(TOKENS);
    auth.cargarPerfil().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(PERFIL_CLIENTE);

    session.limpiar();

    expect(auth.perfil()).toBeNull();
    expect(auth.rol()).toBeNull();
    expect(auth.autenticado()).toBe(false);
    expect(await firstValueFrom(auth.asegurarSesion())).toBe(false);
  });

  it('registra un técnico con el contrato del backend', () => {
    const request: RegistroTecnicoRequest = {
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
      especialidadIds: [1, 3],
      distritoIds: [1],
    };
    let respuesta: unknown;

    auth.registrarTecnico(request).subscribe((resultado) => {
      respuesta = resultado;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/auth/register/tecnico`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(request);
    peticion.flush({ id: 30, correo: request.correo, rol: 'TECNICO' });

    expect(respuesta).toEqual({ id: 30, correo: request.correo, rol: 'TECNICO' });
  });
});
