import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BrandLogo } from '../../../shared/ui/brand-logo';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, BrandLogo],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {}
