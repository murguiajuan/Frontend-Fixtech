import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type ContextoAcceso = 'login' | 'cliente' | 'tecnico' | 'recuperacion';
interface PresentacionAcceso {
  etiqueta: string;
  titulo: string;
  destacado: string;
  descripcion: string;
  icono: string;
  beneficios: readonly { icono: string; titulo: string; detalle: string }[];
}

const PRESENTACIONES: Record<ContextoAcceso, PresentacionAcceso> = {
  login: {
    etiqueta: 'TU TRANQUILIDAD TECH EMPIEZA AQUÍ',
    titulo: 'Tu equipo merece',
    destacado: 'estar en buenas manos.',
    descripcion:
      'Encuentra ayuda técnica, compara propuestas y acompaña cada paso de tu servicio. Todo desde un mismo lugar.',
    icono: 'verified_user',
    beneficios: [
      { icono: 'verified_user', titulo: 'Confianza', detalle: 'Técnicos verificados' },
      { icono: 'request_quote', titulo: 'Claridad', detalle: 'Compara propuestas' },
      { icono: 'receipt_long', titulo: 'Seguimiento', detalle: 'Historial de tu servicio' },
    ],
  },
  cliente: {
    etiqueta: 'SOLUCIONES PARA TU DÍA A DÍA',
    titulo: 'Menos problemas.',
    destacado: 'Más tranquilidad.',
    descripcion:
      'Crea tu cuenta y conecta con técnicos de Piura para cuidar lo que necesitas. Tú eliges la propuesta que mejor se adapta a ti.',
    icono: 'person_add',
    beneficios: [
      { icono: 'edit_note', titulo: 'Describe', detalle: 'Cuéntanos qué sucede' },
      { icono: 'compare_arrows', titulo: 'Compara', detalle: 'Revisa las ofertas' },
      { icono: 'task_alt', titulo: 'Confirma', detalle: 'Califica tu experiencia' },
    ],
  },
  tecnico: {
    etiqueta: 'TU TALENTO, MÁS OPORTUNIDADES',
    titulo: 'Haz que tu trabajo',
    destacado: 'llegue más lejos.',
    descripcion:
      'Presenta tu experiencia, define tu cobertura y gestiona tus servicios en un solo lugar. Tu perfil será revisado antes de habilitar las ofertas.',
    icono: 'engineering',
    beneficios: [
      { icono: 'badge', titulo: 'Tu perfil', detalle: 'Muestra tu experiencia' },
      { icono: 'location_on', titulo: 'Tu zona', detalle: 'Elige dónde trabajar' },
      { icono: 'handshake', titulo: 'Tus clientes', detalle: 'Construye confianza' },
    ],
  },
  recuperacion: {
    etiqueta: 'VOLVER A TU CUENTA ES SENCILLO',
    titulo: 'Retoma el control.',
    destacado: 'Estamos contigo.',
    descripcion:
      'Verifica tu correo con un código de seis dígitos. Después podrás cambiar tu contraseña o acceder directamente a tu cuenta.',
    icono: 'lock_reset',
    beneficios: [
      { icono: 'mail', titulo: 'Tu correo', detalle: 'Recibe el código' },
      { icono: 'timer', titulo: '10 minutos', detalle: 'Validez del código' },
      { icono: 'shield', titulo: 'Un solo uso', detalle: 'Acceso protegido' },
    ],
  },
};

@Component({
  selector: 'app-auth-presentacion',
  imports: [NgOptimizedImage, MatIconModule],
  template: `
    <div class="presentacion">
      <div class="contenido">
        <span class="etiqueta"><span class="punto"></span>{{ contenido().etiqueta }}</span>
        <p class="titulo">
          {{ contenido().titulo }} <span>{{ contenido().destacado }}</span>
        </p>
        <p class="descripcion">{{ contenido().descripcion }}</p>
        <ul class="beneficios">
          @for (beneficio of contenido().beneficios; track beneficio.titulo) {
            <li>
              <mat-icon aria-hidden="true">{{ beneficio.icono }}</mat-icon
              ><strong>{{ beneficio.titulo }}</strong
              ><span>{{ beneficio.detalle }}</span>
            </li>
          }
        </ul>
      </div>
      <div class="foto">
        <img
          ngSrc="/images/landing/hero.webp"
          fill
          priority
          sizes="(min-width: 896px) 45vw, 100vw"
          alt="Técnico FIXTECH revisando una laptop junto a un cliente"
        />
        <div class="foto__nota">
          <span class="nota__icono"
            ><mat-icon aria-hidden="true">{{ contenido().icono }}</mat-icon></span
          ><span
            ><strong>Tecnología que conecta.</strong><small>Personas que te ayudan.</small></span
          >
        </div>
      </div>
      <span class="ubicacion"
        ><mat-icon aria-hidden="true">location_on</mat-icon>Hecho para conectar en Piura, Perú</span
      >
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .presentacion {
      position: relative;
      overflow: hidden;
      border-radius: 1.5rem;
      background: linear-gradient(145deg, #062657, #0b4382);
      color: white;
      height: 100%;
    }
    .contenido {
      padding: 2.5rem 2.5rem 1.75rem;
      position: relative;
      z-index: 1;
    }
    .etiqueta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #d3eaff;
      line-height: 1.5;
    }
    .punto {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff963f;
      flex-shrink: 0;
    }
    .titulo {
      font-size: clamp(2rem, 3vw, 2.8rem);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.045em;
      margin: 1.25rem 0 1rem;
    }
    .titulo span {
      display: block;
      color: #88c8ff;
    }
    .descripcion {
      font-size: 0.9rem;
      line-height: 1.7;
      color: #d7e6f6;
      max-width: 44ch;
    }
    .beneficios {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      list-style: none;
      padding: 1.5rem 0 0;
      margin: 0;
    }
    li {
      display: grid;
      align-content: start;
      gap: 0.45rem;
    }
    li mat-icon {
      color: #9cd4ff;
      width: 24px;
      height: 24px;
      margin-bottom: 0.25rem;
    }
    li strong {
      font-size: 0.8rem;
      font-weight: 600;
    }
    li span {
      font-size: 0.65rem;
      color: #d0e1f5;
      line-height: 1.45;
    }
    .foto {
      position: relative;
      height: 245px;
      margin: 0 1.25rem;
      border-radius: 1rem;
      overflow: hidden;
    }
    .foto img {
      object-fit: cover;
      object-position: center;
    }
    .foto:after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(transparent 45%, #062657b3);
    }
    .foto__nota {
      position: absolute;
      z-index: 1;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #fffffff2;
      border: 1px solid white;
      border-radius: 0.75rem;
      color: #062657;
      box-shadow: 0 8px 25px #06265720;
    }
    .nota__icono {
      display: grid;
      place-items: center;
      background: #e2efff;
      color: #0865d9;
      border-radius: 0.6rem;
      width: 2.5rem;
      height: 2.5rem;
    }
    .foto__nota strong,
    .foto__nota small {
      display: block;
    }
    .foto__nota strong {
      font-size: 0.8rem;
    }
    .foto__nota small {
      font-size: 0.7rem;
      color: #4d617b;
      margin-top: 0.2rem;
    }
    .ubicacion {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      font-size: 0.65rem;
      color: #c9def5;
      padding: 1rem;
    }
    .ubicacion mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }
    @media (max-width: 55.99rem) {
      .contenido {
        padding: 1.25rem 1.5rem;
      }
      .titulo {
        font-size: 1.6rem;
        margin: 0.6rem 0 0;
      }
      .titulo span {
        display: inline;
      }
      .etiqueta {
        font-size: 0.55rem;
      }
      .descripcion,
      .beneficios,
      .foto,
      .ubicacion {
        display: none;
      }
      .presentacion {
        border-radius: 1rem;
      }
    }
  `,
})
export class AuthPresentacion {
  readonly contexto = input<ContextoAcceso>('login');
  protected readonly contenido = computed(() => PRESENTACIONES[this.contexto()]);
}
