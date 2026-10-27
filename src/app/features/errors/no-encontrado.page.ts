import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BrandLogo } from '../../shared/ui/brand-logo';

@Component({
  selector: 'app-no-encontrado-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, BrandLogo],
  template: `
    <main class="pagina">
      <div class="pagina__marca">
        <app-brand />
      </div>
      <section class="pagina__panel ft-card" aria-labelledby="titulo-no-encontrado">
        <span class="pagina__codigo" aria-hidden="true">404</span>
        <p class="ft-eyebrow">Página no encontrada</p>
        <h1 id="titulo-no-encontrado">La ruta que buscas no existe</h1>
        <p class="ft-muted">
          Es posible que el enlace haya cambiado o que la página ya no esté disponible.
        </p>
        <a mat-flat-button routerLink="/">
          <mat-icon aria-hidden="true">home</mat-icon>
          Ir a FIXTECH
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

    .pagina__codigo {
      color: var(--ft-primary-100);
      font-size: clamp(3.5rem, 12vw, 5.5rem);
      font-weight: 700;
      line-height: 0.9;
      letter-spacing: -0.04em;
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
export class NoEncontradoPage {}
