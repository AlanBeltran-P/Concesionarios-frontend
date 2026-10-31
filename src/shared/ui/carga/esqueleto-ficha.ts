import { Component, computed, input } from '@angular/core';

/**
 * Lugar reservado para una ficha o un reporte mientras carga: título, tarjetas de números
 * y un bloque de contenido.
 */
@Component({
  selector: 'app-esqueleto-ficha',
  host: { class: 'flex flex-col gap-6', 'aria-busy': 'true' },
  template: `
    <span class="sr-only" role="status">{{ texto() }}</span>
    @if (titulo()) {
      <div class="flex flex-col gap-3" aria-hidden="true">
        <div class="esqueleto h-8 w-72 max-w-full"></div>
        <div class="esqueleto h-4 w-96 max-w-full"></div>
      </div>
    }
    @if (tarjetas()) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        @for (i of tarjetasLista(); track i) {
          <div class="tarjeta flex flex-col gap-3 p-5">
            <div class="esqueleto h-3.5 w-24"></div>
            <div class="esqueleto h-7 w-36"></div>
            <div class="esqueleto h-3 w-28"></div>
          </div>
        }
      </div>
    }
    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]" aria-hidden="true">
      <div class="tarjeta flex flex-col gap-4 p-6">
        <div class="esqueleto h-5 w-40"></div>
        @for (i of lineas; track i) {
          <div class="esqueleto h-3.5" [style.width.%]="90 - (i % 3) * 15"></div>
        }
      </div>
      <div class="tarjeta flex flex-col gap-4 p-6">
        <div class="esqueleto h-5 w-32"></div>
        @for (i of lineasCortas; track i) {
          <div class="esqueleto h-3.5" [style.width.%]="80 - (i % 2) * 20"></div>
        }
        <div class="esqueleto mt-2 h-10 w-full"></div>
      </div>
    </div>
  `,
})
export class EsqueletoFicha {
  /** Lo que lee un lector de pantalla, ej. "Cargando venta…". */
  readonly texto = input('Cargando…');
  /** Mostrar el título (no hace falta si la pantalla ya tiene el suyo). */
  readonly titulo = input(true);
  /** Cantidad de tarjetas de números arriba (0 = ninguna). */
  readonly tarjetas = input(4);

  protected readonly tarjetasLista = computed(() => [...Array(this.tarjetas()).keys()]);
  protected readonly lineas = [0, 1, 2, 3, 4, 5];
  protected readonly lineasCortas = [0, 1, 2, 3];
}
