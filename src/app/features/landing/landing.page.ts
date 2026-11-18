import { Component, computed, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BrandLogo } from '../../shared/ui/brand-logo';
import { BENEFICIOS, PASOS, SERVICIOS, RESENAS, TECNICOS } from './landing.data';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, NgOptimizedImage, MatIconModule, BrandLogo],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css',
})
export class LandingPage {
  protected readonly menuAbierto = signal(false);
  protected readonly consulta = signal('');
  protected readonly filtro = signal('');
  protected readonly indiceResena = signal(0);
  protected readonly beneficios = BENEFICIOS;
  protected readonly pasos = PASOS;
  protected readonly tecnicos = TECNICOS;
  protected readonly resena = computed(() => RESENAS[this.indiceResena()]);
  protected readonly servicios = computed(() => {
    const normalizar = (valor: string) =>
      valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const palabras = normalizar(this.filtro()).trim().split(/\s+/).filter(Boolean);
    return SERVICIOS.filter((servicio) =>
      palabras.every((palabra) =>
        normalizar(`${servicio.titulo} ${servicio.descripcion} ${servicio.categoria}`).includes(
          palabra,
        ),
      ),
    );
  });

  protected buscar(event: Event): void {
    event.preventDefault();
    this.filtro.set(this.consulta());
    document.getElementById('servicios')?.scrollIntoView({ block: 'start' });
  }

  protected cambiarResena(direccion: number): void {
    this.indiceResena.update((indice) => (indice + direccion + RESENAS.length) % RESENAS.length);
  }
}
