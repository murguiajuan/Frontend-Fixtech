import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { esApiError } from '../../../core/http/api-error';
import { NotificacionService } from '../../../shared/ui/notificacion.service';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formulario = this.fb.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly ocultarPassword = signal(true);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('registrado') === '1') {
      this.notificaciones.exito('Cuenta creada. Ya puedes iniciar sesión.');
    }
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.auth.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: () => {
        void this.router.navigateByUrl(this.urlRetorno());
      },
      error: (error: unknown) => {
        this.errorServidor.set(
          esApiError(error) ? error.mensaje : 'No se pudo iniciar sesión. Intente nuevamente.',
        );
        this.enviando.set(false);
      },
    });
  }

  protected alternarPassword(): void {
    this.ocultarPassword.update((oculto) => !oculto);
  }

  protected mostrarError(campo: 'correo' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  private urlRetorno(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl !== null && returnUrl.startsWith('/app') ? returnUrl : '/app/inicio';
  }
}
