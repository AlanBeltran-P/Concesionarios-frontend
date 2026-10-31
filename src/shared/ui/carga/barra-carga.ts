import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { EstadoCarga } from './estado-carga';

/** Lo que tiene que durar una carga para que aparezca la barra (así no parpadea). */
const DEMORA_MS = 150;

/**
 * Barra fina arriba de la pantalla mientras hay pedidos al backend en curso
 * o mientras se carga otra sección del sitio.
 */
@Component({
  selector: 'app-barra-carga',
  template: `
    @if (visible()) {
      <div
        class="fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-primary/15"
        role="progressbar"
        aria-label="Cargando"
      >
        <div class="barra-carga h-full w-1/3 bg-primary"></div>
      </div>
    }
  `,
})
export class BarraCarga {
  private readonly estado = inject(EstadoCarga);
  protected readonly visible = signal(false);

  constructor() {
    const suscripcion = inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationStart) this.estado.navegando.set(true);
      if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      ) {
        this.estado.navegando.set(false);
      }
    });
    inject(DestroyRef).onDestroy(() => suscripcion.unsubscribe());

    effect((onCleanup) => {
      if (!this.estado.ocupado()) {
        this.visible.set(false);
        return;
      }
      const espera = setTimeout(() => this.visible.set(true), DEMORA_MS);
      onCleanup(() => clearTimeout(espera));
    });
  }
}
