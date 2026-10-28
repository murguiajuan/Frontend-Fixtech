import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionExpiradaService } from './sesion-expirada.service';
import { SessionStore } from './session-store.service';
import { TokenRefreshService } from './token-refresh.service';

const TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiraEnSegundos: 900,
} as const;

describe('TokenRefreshService', () => {
  let servicio: TokenRefreshService;
  let session: SessionStore;
  let sesionExpirada: SesionExpiradaService;
  let http: HttpTestingController;

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(TokenRefreshService);
    session = TestBed.inject(SessionStore);
    sesionExpirada = TestBed.inject(SesionExpiradaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('renueva los tokens y actualiza la sesión', async () => {
    session.guardar(TOKENS);

    const resultado = firstValueFrom(servicio.refrescar());
    const peticion = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ refreshToken: TOKENS.refreshToken });
    peticion.flush({
      ...TOKENS,
      accessToken: 'nuevo-access-token',
      refreshToken: 'nuevo-refresh-token',
    });

    await expect(resultado).resolves.toBe('nuevo-access-token');
    expect(session.accessToken()).toBe('nuevo-access-token');
    expect(session.refreshToken()).toBe('nuevo-refresh-token');
    expect(sesionExpirada.expirada()).toBe(false);
  });

  it('marca la sesión como expirada y la limpia si el refresh falla', async () => {
    session.guardar(TOKENS);

    const resultado = firstValueFrom(servicio.refrescar());
    http
      .expectOne(`${environment.apiUrl}/auth/refresh`)
      .flush({ mensaje: 'Refresh token inválido' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultado).rejects.toBeTruthy();
    expect(session.tieneSesion()).toBe(false);
    expect(sesionExpirada.expirada()).toBe(true);
  });

  it('marca la sesión como expirada si no hay refresh token', async () => {
    const resultado = firstValueFrom(servicio.refrescar());

    await expect(resultado).rejects.toThrow('No hay refresh token disponible');
    expect(sesionExpirada.expirada()).toBe(true);
    http.expectNone(`${environment.apiUrl}/auth/refresh`);
  });
});
