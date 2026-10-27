import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface RetirarOfertaData {
  readonly ofertaId: number;
  readonly precioTotal: number;
}

@Component({
  selector: 'app-retirar-oferta-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Retirar oferta #{{ datos.ofertaId }}</h2>
    <mat-dialog-content>
      <p>
        La oferta de <strong>S/ {{ datos.precioTotal | number: '1.2-2' }}</strong> dejará de estar
        disponible para el cliente. Si la solicitud sigue vigente, podrás enviar una nueva oferta
        después.
      </p>
      <p class="dialogo__nota">Las contraofertas pendientes quedarán superadas.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cerrar()">Volver</button>
      <button mat-flat-button type="button" class="dialogo__confirmar" (click)="confirmar()">
        <mat-icon aria-hidden="true">undo</mat-icon>
        Sí, retirar oferta
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    mat-dialog-content > p {
      color: var(--ft-on-surface-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    .dialogo__confirmar {
      --mat-button-filled-container-color: var(--ft-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class RetirarOfertaDialog {
  private readonly referencia =
    inject<MatDialogRef<RetirarOfertaDialog, true | undefined>>(MatDialogRef);
  protected readonly datos = inject<RetirarOfertaData>(MAT_DIALOG_DATA);

  protected cerrar(): void {
    this.referencia.close();
  }

  protected confirmar(): void {
    this.referencia.close(true);
  }
}
