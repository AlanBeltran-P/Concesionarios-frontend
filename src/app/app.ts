import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraCarga } from '../shared/ui/carga/barra-carga';

// Cada pantalla trae su propio layout (sitio público, panel de gestión o login).
@Component({
  imports: [RouterOutlet, BarraCarga],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
