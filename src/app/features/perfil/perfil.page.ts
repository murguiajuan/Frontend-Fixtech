import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import {
  ETIQUETAS_ESTADO_USUARIO,
  ETIQUETAS_ESTADO_VERIFICACION,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_ROL,
  TONOS_ESTADO_USUARIO,
  TONOS_ESTADO_VERIFICACION,
} from '../../core/models/etiquetas';
import { EstadoBadge } from '../../shared/ui/estado-badge';
import { ImagenAutenticada } from '../../shared/ui/imagen-autenticada';

@Component({
  selector: 'app-perfil-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EstadoBadge,
    ImagenAutenticada,
  ],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
})
export class PerfilPage {
  private readonly auth = inject(AuthService);

  protected readonly perfil = this.auth.perfil;
  protected readonly tecnico = computed(() => this.perfil()?.tecnico ?? null);
  protected readonly esTecnico = computed(() => this.perfil()?.rol === 'TECNICO');
  protected readonly iniciales = computed(() => {
    const perfil = this.perfil();
    return perfil === null
      ? ''
      : `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();
  });

  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly etiquetasEstadoUsuario = ETIQUETAS_ESTADO_USUARIO;
  protected readonly tonosEstadoUsuario = TONOS_ESTADO_USUARIO;
  protected readonly etiquetasEstadoVerificacion = ETIQUETAS_ESTADO_VERIFICACION;
  protected readonly tonosEstadoVerificacion = TONOS_ESTADO_VERIFICACION;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;
}
