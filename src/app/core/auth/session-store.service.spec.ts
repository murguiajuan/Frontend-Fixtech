import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session-store.service';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(SessionStore);
  });

  it('guarda y recupera los tokens de la sesión', () => {
    store.guardar({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiraEnSegundos: 900,
    });

    expect(store.accessToken()).toBe('access-token');
    expect(store.refreshToken()).toBe('refresh-token');
    expect(store.tieneSesion()).toBe(true);
    expect(globalThis.sessionStorage.getItem('fixtech.access-token')).toBe('access-token');
  });

  it('limpia los tokens y el almacenamiento', () => {
    store.guardar({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiraEnSegundos: 900,
    });

    store.limpiar();

    expect(store.accessToken()).toBeNull();
    expect(store.refreshToken()).toBeNull();
    expect(store.tieneSesion()).toBe(false);
    expect(globalThis.sessionStorage.getItem('fixtech.access-token')).toBeNull();
  });

  it('considera vencido un token dentro del margen de seguridad', () => {
    store.guardar({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiraEnSegundos: 10,
    });

    expect(store.tokenVigente()).toBe(false);
    expect(store.tokenVigente(0)).toBe(true);
  });
});
