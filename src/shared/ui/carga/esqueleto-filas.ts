import { Component, computed, input } from '@angular/core';

/**
 * Filas grises animadas para una tabla que está cargando. Va dentro del <tbody>:
 * <app-esqueleto-filas [columnas]="5" />
 */
@Component({
  selector: 'app-esqueleto-filas',
  host: { style: 'display: contents', 'aria-hidden': 'true' },
  template: `
    @for (fila of filasLista(); track fila) {
      <tr>
        @for (col of columnasLista(); track col) {
          <td class="px-5 py-4">
            <div class="flex flex-col gap-2">
              <div class="esqueleto h-3.5" [style.width.%]="ancho(fila, col)"></div>
              @if (col === 0) {
                <div class="esqueleto h-3 w-2/5"></div>
              }
            </div>
          </td>
        }
      </tr>
    }
  `,
})
export class EsqueletoFilas {
  readonly columnas = input(4);
  readonly filas = input(5);

  protected readonly filasLista = computed(() => [...Array(this.filas()).keys()]);
  protected readonly columnasLista = computed(() => [...Array(this.columnas()).keys()]);

  /** Anchos distintos para que no parezca una grilla perfecta. */
  protected ancho(fila: number, col: number): number {
    return 45 + ((fila * 7 + col * 13) % 5) * 10;
  }
}
