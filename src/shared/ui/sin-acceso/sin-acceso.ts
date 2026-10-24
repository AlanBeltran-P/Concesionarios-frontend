import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { Icono } from '../icono/icono';

/** Se muestra cuando el usuario no tiene permiso para la página que quiso abrir. */
@Component({
  selector: 'app-sin-acceso',
  imports: [RouterLink, Icono],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-page px-4">
      <section
        class="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-line bg-surface px-6 py-10 text-center shadow-sm"
      >
        <span class="grid size-12 place-items-center rounded-full bg-subtle text-fg-muted">
          <app-icono nombre="escudo" class="size-6" />
        </span>
        <h1 class="text-h3">No tenés acceso a esta página</h1>
        <p class="text-sm text-fg-secondary">
          @if (esCliente()) {
            El panel de gestión es para empleados. El portal para clientes todavía no está
            disponible.
          } @else {
            Tu rol no tiene permiso para ver esta sección. Si creés que es un error, hablá con un
            administrador.
          }
        </p>
        <div class="flex flex-wrap justify-center gap-3 pt-2">
          @if (!esCliente()) {
            <a
              routerLink="/panel"
              class="flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
            >
              Volver al panel
            </a>
          }
          <button
            type="button"
            (click)="salir()"
            class="flex h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium transition hover:bg-subtle"
          >
            <app-icono nombre="salir" class="size-4" />
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  `,
})
export class SinAcceso {
  private readonly auth = inject(AuthService);
  protected readonly esCliente = computed(() => this.auth.usuario()?.rol === 'CLIENTE');

  protected salir(): void {
    this.auth.logout();
  }
}
