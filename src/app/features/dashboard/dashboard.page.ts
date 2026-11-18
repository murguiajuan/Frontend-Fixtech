import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ClienteInicio } from './cliente-inicio';
import { AdminInicio } from './admin-inicio';
import { AuthService } from '../../core/auth/auth.service';
import {
  ETIQUETAS_ESTADO_VERIFICACION,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_ROL,
} from '../../core/models/etiquetas';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    ClienteInicio,
    AdminInicio,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);

  protected readonly perfil = this.auth.perfil;
  protected readonly etiquetasRol = ETIQUETAS_ROL;
  protected readonly etiquetasVerificacion = ETIQUETAS_ESTADO_VERIFICACION;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  protected readonly esCliente = computed(() => this.perfil()?.rol === 'CLIENTE');
  protected readonly esTecnico = computed(() => this.perfil()?.rol === 'TECNICO');
  protected readonly esAdmin = computed(() => this.perfil()?.rol === 'ADMIN');
  protected readonly tecnico = computed(() => this.perfil()?.tecnico ?? null);
  protected readonly estadoVerificacion = computed(
    () => this.tecnico()?.estadoVerificacion ?? null,
  );
  protected readonly motivoVerificacion = computed(
    () => this.tecnico()?.motivoVerificacion ?? null,
  );
  protected readonly modalidades = computed(() => this.tecnico()?.modalidades ?? []);
  protected readonly saldoPendiente = computed(() => this.tecnico()?.saldoComisionPendiente ?? 0);
  protected readonly aprobado = this.auth.esTecnicoAprobado;
  protected readonly bloqueado = this.auth.bloqueadoPorDeuda;

  protected readonly saludo = computed(() => {
    const nombres = this.perfil()?.nombres;
    return nombres === undefined ? 'Hola' : `Hola, ${nombres}`;
  });

  protected readonly descripcionRol = computed(() => {
    const perfil = this.perfil();
    if (perfil === null) {
      return '';
    }
    switch (perfil.rol) {
      case 'CLIENTE':
        return 'Publica solicitudes, compara ofertas y coordina el servicio con técnicos verificados.';
      case 'TECNICO':
        return 'Gestiona tu perfil, revisa solicitudes compatibles y envía ofertas a los clientes.';
      case 'ADMIN':
        return 'Supervisa la verificación de técnicos, usuarios y la operación general de FIXTECH.';
    }
  });
}
