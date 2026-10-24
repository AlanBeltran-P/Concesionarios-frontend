import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { Icono } from '../icono/icono';
import { NOMBRE_ROL, menuParaRol } from './menu';

/** Estructura del panel de gestión: menú lateral oscuro y el contenido de cada sección a la derecha. */
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './panel-layout.html',
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
})
export class PanelLayout {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;
  protected readonly secciones = computed(() => menuParaRol(this.usuario()?.rol));
  protected readonly nombreRol = computed(() => {
    const rol = this.usuario()?.rol;
    return rol ? NOMBRE_ROL[rol] : '';
  });
  protected readonly iniciales = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : '';
  });

  /** Solo en pantallas chicas: en las grandes el menú está siempre visible. */
  protected readonly menuAbierto = signal(false);

  protected salir(): void {
    this.auth.logout();
  }
}
