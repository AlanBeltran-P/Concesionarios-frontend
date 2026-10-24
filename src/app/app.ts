import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Cada pantalla trae su propio layout (sitio público, panel de gestión o login).
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
