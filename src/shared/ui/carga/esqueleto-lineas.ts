import { Component, computed, input } from '@angular/core';

/** Unas líneas grises animadas en lugar de un bloque de texto o una lista corta que carga. */
@Component({
  selector: 'app-esqueleto-lineas',
  host: { class: 'flex flex-col gap-3', 'aria-busy': 'true' },
  template: `
    <span class="sr-only" role="status">{{ texto() }}</span>
    @for (i of lista(); track i) {
      <div class="esqueleto h-4" [style.width.%]="85 - (i % 3) * 20" aria-hidden="true"></div>
    }
  `,
})
export class EsqueletoLineas {
  readonly lineas = input(3);
  /** Lo que lee un lector de pantalla. */
  readonly texto = input('Cargando…');

  protected readonly lista = computed(() => [...Array(this.lineas()).keys()]);
}
