import { computed, Service, signal } from '@angular/core';
import { TokenResponse } from './auth.models';

const ACCESS_TOKEN_KEY = 'fixtech.access-token';
const REFRESH_TOKEN_KEY = 'fixtech.refresh-token';
const EXPIRES_AT_KEY = 'fixtech.expires-at';

@Service()
export class SessionStore {
  private readonly accessTokenState = signal<string | null>(this.leer(ACCESS_TOKEN_KEY));
  private readonly refreshTokenState = signal<string | null>(this.leer(REFRESH_TOKEN_KEY));
  private readonly expiresAtState = signal<number | null>(this.leerNumero(EXPIRES_AT_KEY));

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly refreshToken = this.refreshTokenState.asReadonly();
  readonly expiresAt = this.expiresAtState.asReadonly();
  readonly tieneSesion = computed(() => this.accessTokenState() !== null);

  guardar(tokens: TokenResponse): void {
    const expiresAt = Date.now() + tokens.expiraEnSegundos * 1000;
    this.accessTokenState.set(tokens.accessToken);
    this.refreshTokenState.set(tokens.refreshToken);
    this.expiresAtState.set(expiresAt);
    this.escribir(ACCESS_TOKEN_KEY, tokens.accessToken);
    this.escribir(REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.escribir(EXPIRES_AT_KEY, String(expiresAt));
  }

  limpiar(): void {
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.expiresAtState.set(null);
    this.eliminar(ACCESS_TOKEN_KEY);
    this.eliminar(REFRESH_TOKEN_KEY);
    this.eliminar(EXPIRES_AT_KEY);
  }

  tokenVigente(margenSegundos = 30): boolean {
    const expiresAt = this.expiresAtState();
    return (
      this.accessTokenState() !== null &&
      expiresAt !== null &&
      expiresAt - margenSegundos * 1000 > Date.now()
    );
  }

  private leer(clave: string): string | null {
    try {
      return globalThis.sessionStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private leerNumero(clave: string): number | null {
    const valor = this.leer(clave);
    if (valor === null) {
      return null;
    }
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private escribir(clave: string, valor: string): void {
    try {
      globalThis.sessionStorage.setItem(clave, valor);
    } catch {
      // La sesión sigue funcionando en memoria si el navegador bloquea el almacenamiento.
    }
  }

  private eliminar(clave: string): void {
    try {
      globalThis.sessionStorage.removeItem(clave);
    } catch {
      // No hay nada más que limpiar.
    }
  }
}
