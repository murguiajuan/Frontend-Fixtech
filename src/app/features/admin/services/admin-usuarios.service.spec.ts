import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminUsuariosService', () => {
  let servicio: AdminUsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminUsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('envía rol, estado y búsqueda', () => {
    servicio.listar({ rol: 'TECNICO', estado: 'SUSPENDIDO', busqueda: '  Ana  ' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/usuarios`,
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('rol')).toBe('TECNICO');
    expect(peticion.request.params.get('estado')).toBe('SUSPENDIDO');
    expect(peticion.request.params.get('busqueda')).toBe('Ana');
    peticion.flush([]);
  });

  it('omite los filtros TODOS y la búsqueda vacía', () => {
    servicio.listar({ rol: 'TODOS', estado: 'TODOS', busqueda: '' }).subscribe();

    const peticion = http.expectOne(
      (solicitud) => solicitud.url === `${environment.apiUrl}/admin/usuarios`,
    );
    expect(peticion.request.params.has('rol')).toBe(false);
    expect(peticion.request.params.has('estado')).toBe(false);
    expect(peticion.request.params.has('busqueda')).toBe(false);
    peticion.flush([]);
  });

  it('cambia el estado usando el id del usuario', () => {
    servicio
      .cambiarEstado(15, { estado: 'SUSPENDIDO', motivo: 'Incumplimiento de normas.' })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/usuarios/15/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'SUSPENDIDO',
      motivo: 'Incumplimiento de normas.',
    });
    peticion.flush({
      id: 15,
      correo: 'usuario@fixtech.pe',
      rol: 'CLIENTE',
      estado: 'SUSPENDIDO',
      motivoSuspension: 'Incumplimiento de normas.',
      nombres: 'Ana',
      apellidos: 'Torres',
      creadoEn: '2026-10-20T10:00:00',
    });
  });

  it('envía motivo nulo al reactivar', () => {
    servicio.cambiarEstado(20, { estado: 'ACTIVO', motivo: null }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/usuarios/20/estado`);
    expect(peticion.request.body).toEqual({ estado: 'ACTIVO', motivo: null });
    peticion.flush({
      id: 20,
      correo: 'usuario@fixtech.pe',
      rol: 'CLIENTE',
      estado: 'ACTIVO',
      motivoSuspension: null,
      nombres: null,
      apellidos: null,
      creadoEn: '2026-10-20T10:00:00',
    });
  });
});
