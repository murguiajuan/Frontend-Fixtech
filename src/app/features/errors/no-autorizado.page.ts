import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BrandLogo } from '../../shared/ui/brand-logo';

@Component({
  selector: 'app-no-autorizado-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, BrandLogo],
  template: `
    <main class="pagina">
      <div class="pagina__marca">
        <app-brand />
      </div>
      <section class="pagina__panel ft-card" aria-labelledby="titulo-no-autorizado">
        <span class="pagina__icono pagina__icono--alerta" aria-hidden="true">
          <mat-icon>lock_person</mat-icon>
        </span>
        <p class="ft-eyebrow">Acceso restringido</p>
        <h1 id="titulo-no-autorizado">No tienes permisos para esta sección</h1>
        <p class="ft-muted">
          Tu cuenta no tiene el rol necesario para acceder a esta pantalla. Si crees que es un
          error, contacta al administrador de FIXTECH.
        </p>
        <a mat-flat-button routerLink="/app/inicio">
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          Volver al inicio
        </a>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    .pagina {
      display: grid;
      min-height: 100dvh;
      place-content: center;
      justify-items: center;
      gap: 1.5rem;
      padding: 2rem 1rem;
    }

    .pagina__marca {
      color: var(--ft-primary-950);
    }

    .pagina__panel {
      display: grid;
      justify-items: start;
      gap: 0.75rem;
      width: min(100%, 32rem);
      padding: 2rem;
      box-shadow: var(--ft-shadow-md);
    }

    .pagina__icono {
      display: grid;
      width: 3.5rem;
      height: 3.5rem;
      place-items: center;
      border-radius: 1rem;
      background: var(--ft-warning-bg);
      color: var(--ft-warning);
    }

    h1 {
      font-size: clamp(1.6rem, 5vw, 2.1rem);
    }

    p {
      line-height: 1.6;
    }

    a {
      margin-top: 0.5rem;
    }
  `,
})
export class NoAutorizadoPage {}
