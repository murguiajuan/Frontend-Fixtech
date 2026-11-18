import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AuthPresentacion } from '../auth-presentacion';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { urlRetornoSegura } from '../../../core/auth/return-url';
import { esApiError } from '../../../core/http/api-error';
import { Icono } from '../../../shared/ui/icono';
import { NotificacionService } from '../../../shared/ui/notificacion.service';

type PasoRecuperacion = 'correo' | 'codigo' | 'opciones';

const ORDEN_PASOS: Record<PasoRecuperacion, number> = {
  correo: 0,
  codigo: 1,
  opciones: 2,
};

const SEGUNDOS_REENVIO = 60;

@Component({
  selector: 'app-recuperar-password-page',
  imports: [
    AuthPresentacion,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Icono,
  ],
  templateUrl: './recuperar-password.page.html',
  styleUrl: './recuperar-password.page.scss',
})
export class RecuperarPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificaciones = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  private cuentaAtras: Subscription | null = null;

  protected readonly correoForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  protected readonly codigoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected readonly passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: [passwordsIguales] },
  );

  protected readonly paso = signal<PasoRecuperacion>('correo');
  protected readonly correo = signal('');
  protected readonly ticket = signal('');
  protected readonly minutosTicket = signal(10);
  protected readonly segundosReenvio = signal(0);
  protected readonly enviando = signal(false);
  protected readonly verificando = signal(false);
  protected readonly restableciendo = signal(false);
  protected readonly accediendo = signal(false);
  protected readonly enviadoCorreo = signal(false);
  protected readonly enviadoCodigo = signal(false);
  protected readonly enviadoPassword = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly ocultarPassword = signal(true);
  protected readonly ocultarConfirmacion = signal(true);

  protected readonly correoVisible = computed(() => ocultarCorreo(this.correo()));
  protected readonly etiquetaReenvio = computed(() => {
    const segundos = this.segundosReenvio();
    return segundos > 0 ? `Reenviar en ${segundos} s` : 'Reenviar código';
  });
  protected readonly puedeReenviar = computed(
    () => this.segundosReenvio() === 0 && !this.enviando(),
  );

  protected solicitarCodigo(): void {
    this.enviadoCorreo.set(true);
    this.errorServidor.set(null);
    if (this.correoForm.invalid) {
      this.correoForm.markAllAsTouched();
      return;
    }

    const correo = this.correoForm.controls.correo.value.trim().toLowerCase();
    this.enviando.set(true);
    this.auth.solicitarRecuperacion(correo).subscribe({
      next: (respuesta) => {
        this.correo.set(correo);
        this.codigoForm.reset();
        this.enviadoCodigo.set(false);
        this.paso.set('codigo');
        this.iniciarCuentaAtras();
        this.notificaciones.info(respuesta.mensaje);
        this.enviando.set(false);
      },
      error: (error: unknown) => {
        this.errorServidor.set(
          mensajeError(error, 'No se pudo enviar el código. Intente nuevamente.'),
        );
        this.enviando.set(false);
      },
    });
  }

  protected reenviarCodigo(): void {
    if (!this.puedeReenviar()) {
      return;
    }
    this.enviadoCorreo.set(true);
    this.enviando.set(true);
    this.errorServidor.set(null);
    this.auth.solicitarRecuperacion(this.correo()).subscribe({
      next: (respuesta) => {
        this.codigoForm.reset();
        this.enviadoCodigo.set(false);
        this.iniciarCuentaAtras();
        this.notificaciones.info(respuesta.mensaje);
        this.enviando.set(false);
      },
      error: (error: unknown) => {
        this.errorServidor.set(
          mensajeError(error, 'No se pudo reenviar el código. Intente nuevamente.'),
        );
        this.enviando.set(false);
      },
    });
  }

  protected verificarCodigo(): void {
    this.enviadoCodigo.set(true);
    this.errorServidor.set(null);
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      return;
    }

    const codigo = this.codigoForm.controls.codigo.value.trim();
    this.verificando.set(true);
    this.auth.verificarRecuperacion(this.correo(), codigo).subscribe({
      next: (respuesta) => {
        this.ticket.set(respuesta.ticket);
        this.minutosTicket.set(Math.max(1, Math.round(respuesta.expiraEnSegundos / 60)));
        this.paso.set('opciones');
        this.verificando.set(false);
      },
      error: (error: unknown) => {
        this.errorServidor.set(mensajeError(error, 'El código no es válido o expiró.'));
        this.verificando.set(false);
      },
    });
  }

  protected restablecerPassword(): void {
    this.enviadoPassword.set(true);
    this.errorServidor.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.restableciendo.set(true);
    const password = this.passwordForm.controls.password.value;
    this.auth.restablecerPassword(this.ticket(), password).subscribe({
      next: () => {
        this.restableciendo.set(false);
        this.notificaciones.exito('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
        void this.router.navigate(['/login'], {
          queryParams: { recuperado: '1', ...this.parametrosRetorno() },
        });
      },
      error: (error: unknown) => {
        this.errorServidor.set(
          mensajeError(error, 'No se pudo cambiar la contraseña. Solicita un nuevo código.'),
        );
        this.restableciendo.set(false);
      },
    });
  }

  protected accederSinCambiar(): void {
    this.errorServidor.set(null);
    this.accediendo.set(true);
    this.auth.accederConRecuperacion(this.ticket()).subscribe({
      next: () => {
        this.accediendo.set(false);
        void this.router.navigateByUrl(this.urlRetorno());
      },
      error: (error: unknown) => {
        this.errorServidor.set(
          mensajeError(error, 'La verificación expiró. Solicita un nuevo código.'),
        );
        this.accediendo.set(false);
      },
    });
  }

  protected usarOtroCorreo(): void {
    this.detenerCuentaAtras();
    this.segundosReenvio.set(0);
    this.codigoForm.reset();
    this.passwordForm.reset();
    this.enviadoCodigo.set(false);
    this.enviadoPassword.set(false);
    this.errorServidor.set(null);
    this.ticket.set('');
    this.paso.set('correo');
  }

  protected alternarPassword(): void {
    this.ocultarPassword.update((oculto) => !oculto);
  }

  protected alternarConfirmacion(): void {
    this.ocultarConfirmacion.update((oculto) => !oculto);
  }

  protected pasoCompletado(paso: PasoRecuperacion): boolean {
    return ORDEN_PASOS[this.paso()] > ORDEN_PASOS[paso];
  }

  protected pasoActivo(paso: PasoRecuperacion): boolean {
    return this.paso() === paso;
  }

  protected mostrarErrorCorreo(): boolean {
    const control = this.correoForm.controls.correo;
    return control.invalid && (control.touched || this.enviadoCorreo());
  }

  protected mostrarErrorCodigo(): boolean {
    const control = this.codigoForm.controls.codigo;
    return control.invalid && (control.touched || this.enviadoCodigo());
  }

  protected mostrarErrorPassword(campo: 'password' | 'confirmarPassword'): boolean {
    const control = this.passwordForm.controls[campo];
    return control.invalid && (control.touched || this.enviadoPassword());
  }

  protected mostrarErrorConfirmacion(): boolean {
    const control = this.passwordForm.controls.confirmarPassword;
    return (
      (control.touched || this.enviadoPassword()) &&
      this.passwordForm.hasError('passwordsDistintas')
    );
  }

  protected parametrosRetorno(): Record<string, string> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl === null ? {} : { returnUrl };
  }

  private urlRetorno(): string {
    return urlRetornoSegura(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  private iniciarCuentaAtras(): void {
    this.detenerCuentaAtras();
    this.segundosReenvio.set(SEGUNDOS_REENVIO);
    this.cuentaAtras = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const restantes = this.segundosReenvio() - 1;
        this.segundosReenvio.set(Math.max(0, restantes));
        if (restantes <= 0) {
          this.detenerCuentaAtras();
        }
      });
  }

  private detenerCuentaAtras(): void {
    this.cuentaAtras?.unsubscribe();
    this.cuentaAtras = null;
  }
}

function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmarPassword')?.value;
  return password === confirmacion ? null : { passwordsDistintas: true };
}

function ocultarCorreo(correo: string): string {
  if (correo === '') {
    return '';
  }
  const [usuario, dominio] = correo.split('@');
  if (dominio === undefined || usuario === undefined) {
    return correo;
  }
  const visible = usuario.slice(0, Math.min(2, usuario.length));
  return `${visible}***@${dominio}`;
}

function mensajeError(error: unknown, respaldo: string): string {
  return esApiError(error) ? error.mensaje : respaldo;
}
