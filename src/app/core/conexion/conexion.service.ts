import { computed, DestroyRef, inject, Service, signal } from '@angular/core';

/**
 * Estado de conectividad del navegador.
 *
 * `navigator.onLine` solo indica si el sistema operativo reporta una interfaz
 * de red activa; una API caída o un portal cautivo pueden seguir fallando.
 * Por eso el aviso es informativo y las peticiones conservan su manejo de error.
 */
@Service()
export class ConexionService {
  private readonly enLineaState = signal(this.estadoInicial());
  private readonly destroyRef = inject(DestroyRef);

  readonly enLinea = this.enLineaState.asReadonly();
  readonly sinConexion = computed(() => !this.enLineaState());

  constructor() {
    const alVolverEnLinea = (): void => this.enLineaState.set(true);
    const alPerderConexion = (): void => this.enLineaState.set(false);

    globalThis.addEventListener('online', alVolverEnLinea);
    globalThis.addEventListener('offline', alPerderConexion);

    this.destroyRef.onDestroy(() => {
      globalThis.removeEventListener('online', alVolverEnLinea);
      globalThis.removeEventListener('offline', alPerderConexion);
    });
  }

  private estadoInicial(): boolean {
    return globalThis.navigator?.onLine ?? true;
  }
}
