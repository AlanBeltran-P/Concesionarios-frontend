import { Component, computed, input, output } from '@angular/core';
import { Pagina } from '../../types/pagina';

/** Pie de una tabla paginada: "1–20 de 48" y los botones Anterior / Siguiente. */
@Component({
  selector: 'app-paginado',
  template: `
    @if (info(); as p) {
      @if (p.totalElements > 0) {
        <nav
          class="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm"
          aria-label="Paginado"
        >
          <span class="text-fg-muted">{{ rango() }}</span>
          @if (p.totalPages > 1) {
            <div class="flex gap-2">
              <button
                type="button"
                class="boton boton-secundario h-9"
                [disabled]="p.number === 0"
                (click)="cambiar.emit(p.number - 1)"
              >
                Anterior
              </button>
              <button
                type="button"
                class="boton boton-secundario h-9"
                [disabled]="p.number + 1 >= p.totalPages"
                (click)="cambiar.emit(p.number + 1)"
              >
                Siguiente
              </button>
            </div>
          }
        </nav>
      }
    }
  `,
})
export class Paginado {
  readonly info = input<Pagina<unknown>['page'] | undefined>();
  /** Número de página pedido (empieza en 0). */
  readonly cambiar = output<number>();

  protected readonly rango = computed(() => {
    const p = this.info();
    if (!p) return '';
    const desde = p.number * p.size + 1;
    return `${desde}–${Math.min(desde + p.size - 1, p.totalElements)} de ${p.totalElements}`;
  });
}
