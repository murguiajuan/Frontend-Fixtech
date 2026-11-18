import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { normalizarError } from '../../core/http/api-error';
import { AdminReportesService } from '../admin/services/admin-reportes.service';
import { DashboardAdmin } from '../admin/reportes/reportes.models';

@Component({
  selector: 'app-admin-inicio',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  providers: [AdminReportesService],
  templateUrl: './admin-inicio.html',
  styleUrl: './admin-inicio.scss',
})
export class AdminInicio {
  private readonly auth = inject(AuthService);
  private readonly reportes = inject(AdminReportesService);

  protected readonly nombre = computed(
    () => this.auth.perfil()?.nombres?.split(' ')[0] || 'administrador',
  );
  protected readonly resumenResource = rxResource({
    stream: () => this.reportes.obtenerDashboard(),
  });
  protected readonly resumen = computed<DashboardAdmin | null>(() =>
    this.resumenResource.hasValue() ? this.resumenResource.value() : null,
  );
  protected readonly error = computed(() => {
    const fallo = this.resumenResource.error();
    return fallo === undefined ? null : normalizarError(fallo).mensaje;
  });

  protected reintentar(): void {
    this.resumenResource.reload();
  }
}
