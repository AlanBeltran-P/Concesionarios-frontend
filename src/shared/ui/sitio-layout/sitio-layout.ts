import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { Icono } from '../icono/icono';

/** Datos de la empresa: los mismos que van en el comprobante de venta (config de venta-service). */
const EMPRESA = {
  nombre: 'Concesionaria Demo S.A.',
  direccion: 'Av. Siempre Viva 742, CABA',
  telefono: '(011) 4555-0000',
};

/** Estructura del sitio público: barra de navegación, contenido y pie. */
@Component({
  selector: 'app-sitio-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './sitio-layout.html',
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
})
export class SitioLayout {
  private readonly auth = inject(AuthService);

  protected readonly empresa = EMPRESA;
  protected readonly anio = new Date().getFullYear();
  protected readonly usuario = this.auth.usuario;
  protected readonly esEmpleado = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'VENDEDOR';
  });
  protected readonly menuAbierto = signal(false);

  protected readonly enlaces = [
    { ruta: '/', texto: 'Catálogo', exacto: true },
    { ruta: '/financiacion', texto: 'Financiación', exacto: false },
  ];

  protected salir(): void {
    this.auth.logout();
  }
}
