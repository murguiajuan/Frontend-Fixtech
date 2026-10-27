import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { EstadoVerificacion } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ETIQUETAS_ESTADO_USUARIO,
  ETIQUETAS_ESTADO_VERIFICACION,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_ROL,
  TONOS_ESTADO_VERIFICACION,
} from '../../../core/models/etiquetas';
import { EstadoBadge } from '../../../shared/ui/estado-badge';

interface MensajeEstado {
  readonly titulo: string;
  readonly mensaje: string;
  readonly icono: string;
}

const MENSAJES_ESTADO: Record<EstadoVerificacion, MensajeEstado> = {
  PENDIENTE: {
    titulo: 'Tu perfil está en revisión',
    mensaje:
      'Un administrador revisará tus datos y tu experiencia. Mientras tanto puedes iniciar sesión, pero aún no recibirás solicitudes ni podrás enviar ofertas.',
    icono: 'hourglass_top',
  },
  APROBADO: {
    titulo: 'Tu perfil está aprobado',
    mensaje:
      'Tu perfil pasó la verificación. Ya puedes recibir solicitudes compatibles y enviar ofertas mientras no tengas bloqueos pendientes.',
    icono: 'verified',
  },
  OBSERVADO: {
    titulo: 'Tu perfil necesita correcciones',
    mensaje:
      'El administrador observó tu perfil. Revisa el motivo indicado y contacta al equipo de FIXTECH para regularizar tu información. La edición de datos desde la aplicación todavía no está disponible.',
    icono: 'report_problem',
  },
  RECHAZADO: {
    titulo: 'Tu perfil no fue aprobado',
    mensaje:
      'La verificación no fue aprobada. Revisa el motivo indicado y contacta al equipo de FIXTECH si consideras que se trata de un error o necesitas orientación.',
    icono: 'cancel',
  },
};

@Component({
  selector: 'app-perfil-tecnico-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
  ],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
})
export class PerfilTecnicoPage {
  private readonly auth = inject(AuthService);

  protected readonly perfil = this.auth.perfil;
  protected readonly tecnico = computed(() => this.perfil()?.tecnico ?? null);
  protected readonly estado = computed<EstadoVerificacion>(
    () => this.tecnico()?.estadoVerificacion ?? 'PENDIENTE',
  );
  protected readonly mensajeEstado = computed(() => MENSAJES_ESTADO[this.estado()]);
  protected readonly etiquetaEstado = computed(() => ETIQUETAS_ESTADO_VERIFICACION[this.estado()]);
  protected readonly tonoEstado = computed(() => TONOS_ESTADO_VERIFICACION[this.estado()]);
  protected readonly modalidades = computed(() => this.tecnico()?.modalidades ?? []);
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
  protected readonly etiquetasEstadoUsuario = ETIQUETAS_ESTADO_USUARIO;
  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly iniciales = computed(() => {
    const perfil = this.perfil();
    return perfil === null
      ? ''
      : `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();
  });
  protected readonly esAprobado = computed(() => this.estado() === 'APROBADO');
  protected readonly requiereAtencion = computed(
    () => this.estado() === 'OBSERVADO' || this.estado() === 'RECHAZADO',
  );
}
