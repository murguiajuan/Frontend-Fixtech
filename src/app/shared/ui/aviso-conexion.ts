import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConexionService } from '../../core/conexion/conexion.service';

@Component({
  selector: 'app-aviso-conexion',
  imports: [MatIconModule],
  template: `
    @if (sinConexion()) {
      <div class="aviso" role="status" aria-live="polite">
        <mat-icon aria-hidden="true">cloud_off</mat-icon>
        <p>
          <strong>Sin conexión.</strong>
          Revisa tu red. Algunas acciones pueden fallar hasta que vuelvas a conectarte.
        </p>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .aviso {
      display: flex;
      gap: 0.625rem;
      align-items: center;
      padding: 0.625rem 1rem;
      border-bottom: 1px solid rgb(154 91 0 / 24%);
      background: var(--ft-warning-bg);
      color: var(--ft-warning);
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .aviso p {
      margin: 0;
    }

    .aviso mat-icon {
      flex: 0 0 auto;
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
  `,
})
export class AvisoConexion {
  private readonly conexion = inject(ConexionService);
  protected readonly sinConexion = this.conexion.sinConexion;
}
