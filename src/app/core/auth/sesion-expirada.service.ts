import { Service, signal } from '@angular/core';

/**
 * Conserva el motivo del cierre de sesión para que la pantalla de acceso pueda
 * avisar al usuario que su sesión expiró. El aviso se consume una sola vez.
 */
@Service()
export class SesionExpiradaService {
  private readonly expiradaState = signal(false);

  readonly expirada = this.expiradaState.asReadonly();

  marcarExpirada(): void {
    this.expiradaState.set(true);
  }

  consumir(): boolean {
    const expirada = this.expiradaState();
    this.expiradaState.set(false);
    return expirada;
  }

  limpiar(): void {
    this.expiradaState.set(false);
  }
}
