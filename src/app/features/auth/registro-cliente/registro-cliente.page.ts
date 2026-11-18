import { Component, inject, signal } from '@angular/core';
import { AuthPresentacion } from '../auth-presentacion';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistroClienteRequest } from '../../../core/auth/auth.models';
import { esApiError } from '../../../core/http/api-error';
import { Icono } from '../../../shared/ui/icono';

type CampoRegistro =
  | 'nombres'
  | 'apellidos'
  | 'correo'
  | 'celular'
  | 'dni'
  | 'password'
  | 'confirmarPassword'
  | 'aceptoTerminos';

@Component({
  selector: 'app-registro-cliente-page',
  imports: [
    AuthPresentacion,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Icono,
  ],
  templateUrl: './registro-cliente.page.html',
  styleUrl: './registro-cliente.page.scss',
})
export class RegistroClientePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formulario = this.fb.group(
    {
      nombres: ['', [Validators.required, Validators.maxLength(80)]],
      apellidos: ['', [Validators.required, Validators.maxLength(80)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      dni: ['', [Validators.pattern(/^\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmarPassword: ['', [Validators.required]],
      aceptoTerminos: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordsIguales] },
  );

  protected readonly registrando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly detallesError = signal<readonly string[]>([]);
  protected readonly ocultarPassword = signal(true);

  protected enviar(): void {
    this.enviado.set(true);
    this.errorServidor.set(null);
    this.detallesError.set([]);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const dni = valores.dni.trim();
    const request: RegistroClienteRequest = {
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim().toLowerCase(),
      celular: valores.celular.trim(),
      dni: dni === '' ? null : dni,
      password: valores.password,
      aceptoTerminos: valores.aceptoTerminos,
    };

    this.registrando.set(true);
    this.auth.registrarCliente(request).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          queryParams: { registrado: 1 },
        });
      },
      error: (error: unknown) => {
        if (esApiError(error)) {
          this.errorServidor.set(error.mensaje);
          this.detallesError.set(error.detalles);
        } else {
          this.errorServidor.set('No se pudo crear la cuenta. Intente nuevamente.');
        }
        this.registrando.set(false);
      },
    });
  }

  protected alternarPassword(): void {
    this.ocultarPassword.update((oculto) => !oculto);
  }

  protected mostrarError(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mostrarErrorConfirmacion(): boolean {
    const control = this.formulario.controls.confirmarPassword;
    return (control.touched || this.enviado()) && this.formulario.hasError('passwordsDistintas');
  }
}

function passwordsIguales(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmarPassword')?.value;
  return password === confirmacion ? null : { passwordsDistintas: true };
}
