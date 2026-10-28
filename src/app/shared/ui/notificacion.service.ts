import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Service()
export class NotificacionService {
  private readonly snackBar = inject(MatSnackBar);

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'ft-snackbar-exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'ft-snackbar-error');
  }

  info(mensaje: string): void {
    this.mostrar(mensaje, 'ft-snackbar-exito');
  }

  private mostrar(mensaje: string, panelClass: string): void {
    this.snackBar.open(mensaje, undefined, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [panelClass],
    });
  }
}
