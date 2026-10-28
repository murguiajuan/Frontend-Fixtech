import { formatCurrency } from '@angular/common';

export function formatearMoneda(monto: number): string {
  return formatCurrency(monto, 'es-PE', 'S/', 'PEN', '1.2-2');
}

export function esFechaVencida(fecha: string, hoy: Date = new Date()): boolean {
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return fecha < `${anio}-${mes}-${dia}`;
}
