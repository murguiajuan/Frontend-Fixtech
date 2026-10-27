import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EstadoBadge } from '../../../shared/ui/estado-badge';
import { ETIQUETAS_MODALIDAD } from '../../../core/models/etiquetas';
import { ETIQUETAS_ESTADO_OFERTA, TONOS_ESTADO_OFERTA } from '../oferta-etiquetas';
import { Oferta } from '../oferta.models';

export interface CompararOfertasData {
  readonly ofertas: readonly Oferta[];
}

interface ColumnaComparacion {
  readonly oferta: Oferta;
  readonly mejorPrecio: boolean;
  readonly mejorTiempo: boolean;
  readonly mejorCalificacion: boolean;
  readonly mayorGarantia: boolean;
}

@Component({
  selector: 'app-comparar-ofertas-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule, EstadoBadge],
  template: `
    <h2 mat-dialog-title>Comparar ofertas</h2>
    <mat-dialog-content>
      <p class="comparacion__nota">
        El total suma el precio del servicio y la movilidad. El costo de diagnóstico se muestra
        aparte y no forma parte del total.
      </p>

      <div class="comparacion__tabla-contenedor">
        <table class="comparacion">
          <caption>
            Comparación de
            {{
              columnas().length
            }}
            ofertas para la solicitud #{{
              datos.ofertas[0]?.solicitudId
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Criterio</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <th scope="col">
                  <span class="comparacion__tecnico">
                    {{ columna.oferta.tecnico.nombres }} {{ columna.oferta.tecnico.apellidos }}
                  </span>
                  <span class="comparacion__id">Oferta #{{ columna.oferta.id }}</span>
                  <app-estado-badge
                    [texto]="etiquetasEstado[columna.oferta.estado]"
                    [tono]="tonosEstado[columna.oferta.estado]"
                  />
                  <span class="comparacion__destacados">
                    @if (columna.mejorPrecio) {
                      <span class="comparacion__destacado">Menor total</span>
                    }
                    @if (columna.mejorTiempo) {
                      <span class="comparacion__destacado">Más rápida</span>
                    }
                    @if (columna.mejorCalificacion) {
                      <span class="comparacion__destacado">Mejor calificada</span>
                    }
                    @if (columna.mayorGarantia) {
                      <span class="comparacion__destacado">Mayor garantía</span>
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Calificación</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>
                  {{ columna.oferta.tecnico.calificacionPromedio ?? 0 | number: '1.1-2' }}
                  <small>({{ columna.oferta.tecnico.totalResenas }} reseñas)</small>
                </td>
              }
            </tr>
            <tr>
              <th scope="row">Experiencia</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>{{ columna.oferta.tecnico.aniosExperiencia }} años</td>
              }
            </tr>
            <tr>
              <th scope="row">Modalidad</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>{{ etiquetasModalidad[columna.oferta.modalidad] }}</td>
              }
            </tr>
            <tr>
              <th scope="row">Precio del servicio</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>S/ {{ columna.oferta.precioServicio | number: '1.2-2' }}</td>
              }
            </tr>
            <tr>
              <th scope="row">Movilidad</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>S/ {{ columna.oferta.costoMovilidad | number: '1.2-2' }}</td>
              }
            </tr>
            <tr>
              <th scope="row">Diagnóstico</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>S/ {{ columna.oferta.costoDiagnostico | number: '1.2-2' }}</td>
              }
            </tr>
            <tr class="comparacion__total">
              <th scope="row">Total (sin diagnóstico)</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>S/ {{ columna.oferta.precioTotal | number: '1.2-2' }}</td>
              }
            </tr>
            <tr>
              <th scope="row">Tiempo estimado</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>{{ columna.oferta.tiempoEstimadoHoras }} h</td>
              }
            </tr>
            <tr>
              <th scope="row">Garantía</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>{{ columna.oferta.garantiaDias }} días</td>
              }
            </tr>
            <tr>
              <th scope="row">Mensaje</th>
              @for (columna of columnas(); track columna.oferta.id) {
                <td>{{ columna.oferta.mensaje ?? 'Sin mensaje' }}</td>
              }
            </tr>
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 0.85rem;
      padding-top: 0.5rem;
    }

    .comparacion__nota {
      color: var(--ft-on-surface-muted);
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .comparacion__tabla-contenedor {
      overflow-x: auto;
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-md);
    }

    .comparacion {
      width: 100%;
      min-width: 40rem;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .comparacion caption {
      padding: 0.75rem;
      color: var(--ft-on-surface-muted);
      font-size: 0.78rem;
      text-align: left;
    }

    .comparacion th,
    .comparacion td {
      padding: 0.65rem 0.75rem;
      border-top: 1px solid var(--ft-border);
      text-align: left;
      vertical-align: top;
    }

    .comparacion thead th {
      background: var(--ft-surface);
    }

    .comparacion tbody th {
      background: var(--ft-surface);
      color: var(--ft-primary-900);
      font-size: 0.72rem;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .comparacion__tecnico,
    .comparacion__id {
      display: block;
    }

    .comparacion__tecnico {
      color: var(--ft-primary-950);
      font-size: 0.86rem;
    }

    .comparacion__id {
      margin-bottom: 0.35rem;
      color: var(--ft-on-surface-muted);
      font-size: 0.7rem;
      font-weight: 500;
    }

    .comparacion__destacados {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.35rem;
    }

    .comparacion__destacado {
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      background: var(--ft-success-bg);
      color: var(--ft-success);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .comparacion__total td {
      color: var(--ft-primary-900);
      font-weight: 700;
    }

    .comparacion small {
      color: var(--ft-on-surface-muted);
    }

    mat-dialog-actions {
      padding-bottom: 1rem;
    }
  `,
})
export class CompararOfertasDialog {
  protected readonly datos = inject<CompararOfertasData>(MAT_DIALOG_DATA);
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_OFERTA;
  protected readonly tonosEstado = TONOS_ESTADO_OFERTA;
  protected readonly etiquetasModalidad = ETIQUETAS_MODALIDAD;

  private readonly menorPrecio = computed(() =>
    Math.min(...this.datos.ofertas.map((oferta) => oferta.precioTotal)),
  );
  private readonly menorTiempo = computed(() =>
    Math.min(...this.datos.ofertas.map((oferta) => oferta.tiempoEstimadoHoras)),
  );
  private readonly mayorCalificacion = computed(() =>
    Math.max(...this.datos.ofertas.map((oferta) => oferta.tecnico.calificacionPromedio ?? 0)),
  );
  private readonly mayorGarantia = computed(() =>
    Math.max(...this.datos.ofertas.map((oferta) => oferta.garantiaDias)),
  );

  protected readonly columnas = computed<readonly ColumnaComparacion[]>(() =>
    this.datos.ofertas.map((oferta) => ({
      oferta,
      mejorPrecio: oferta.precioTotal === this.menorPrecio(),
      mejorTiempo: oferta.tiempoEstimadoHoras === this.menorTiempo(),
      mejorCalificacion:
        this.mayorCalificacion() > 0 &&
        (oferta.tecnico.calificacionPromedio ?? 0) === this.mayorCalificacion(),
      mayorGarantia: this.mayorGarantia() > 0 && oferta.garantiaDias === this.mayorGarantia(),
    })),
  );
}
