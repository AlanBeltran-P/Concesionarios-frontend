import { Component, computed, input } from '@angular/core';

export interface Columna {
  etiqueta: string;
  valor: number;
  /** Línea extra del tooltip, ej. "3 unidades". */
  detalle?: string;
}

/** Tope "redondo" del eje: 1, 2 o 5 × 10^n, mayor o igual al máximo. */
export function topeRedondo(maximo: number): number {
  if (maximo <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  return ([1, 2, 5, 10].find((m) => m * potencia >= maximo) ?? 10) * potencia;
}

/**
 * Gráfico de columnas de una sola serie (sin leyenda: el título dice qué se grafica).
 * Columnas finas con la punta redondeada, grilla tenue, tooltip al pasar o enfocar
 * cada columna, la última columna con su valor y una tabla con los mismos datos.
 */
@Component({
  selector: 'app-grafico-columnas',
  template: `
    <figure class="flex flex-col gap-3" [attr.aria-label]="titulo()">
      <!-- pt-3: lugar para la marca de arriba del eje -->
      <div class="flex gap-3 pt-3">
        <!-- Eje Y -->
        <div
          class="relative h-56 w-14 shrink-0 text-right text-[11px] text-fg-muted"
          aria-hidden="true"
        >
          @for (t of marcas(); track $index) {
            <span class="absolute right-0 -translate-y-1/2" [style.bottom.%]="t.altura">
              {{ formatoEje()(t.valor) }}
            </span>
          }
        </div>

        <div class="relative flex-1">
          <!-- Grilla -->
          @for (t of marcas(); track $index) {
            <div
              class="pointer-events-none absolute inset-x-0 border-t border-line"
              [style.bottom.%]="t.altura"
              aria-hidden="true"
            ></div>
          }

          <!-- Columnas -->
          <div class="relative flex h-56 items-end justify-around gap-1">
            @for (c of columnas(); track c.etiqueta; let ultima = $last) {
              <button
                type="button"
                class="group relative flex h-full flex-1 items-end justify-center outline-none"
                [attr.aria-label]="c.etiqueta + ': ' + formatoValor()(c.valor)"
              >
                <span
                  class="w-full max-w-6 rounded-t-[4px] bg-primary transition group-hover:bg-primary-hover group-focus:bg-primary-hover"
                  [style.height.%]="c.altura"
                  [style.min-height.px]="c.valor > 0 ? 2 : 0"
                ></span>
                @if (ultima && c.valor > 0) {
                  <span
                    class="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1 text-[11px] font-semibold whitespace-nowrap text-fg group-hover:invisible group-focus:invisible"
                    [style.bottom.%]="c.altura"
                  >
                    {{ formatoEje()(c.valor) }}
                  </span>
                }
                <!-- Tooltip -->
                <span
                  class="pointer-events-none invisible absolute z-10 mb-2 flex -translate-x-1/2 flex-col rounded-md border border-line bg-surface px-3 py-2 text-left whitespace-nowrap shadow-md group-hover:visible group-focus:visible"
                  [style.bottom.%]="c.altura"
                  [style.left.%]="50"
                  role="tooltip"
                >
                  <span class="text-sm font-semibold text-fg">{{ formatoValor()(c.valor) }}</span>
                  <span class="text-xs text-fg-muted">
                    {{ c.etiqueta }}
                    @if (c.detalle) {
                      · {{ c.detalle }}
                    }
                  </span>
                </span>
              </button>
            }
          </div>

          <!-- Eje X -->
          <div class="mt-2 flex justify-around gap-1 text-[11px] text-fg-muted" aria-hidden="true">
            @for (c of columnas(); track c.etiqueta; let i = $index) {
              <span
                class="flex-1 text-center whitespace-nowrap"
                [class.oculto-en-celular]="columnas().length > 6 && i % 2 === 1"
              >
                {{ c.etiqueta }}
              </span>
            }
          </div>
        </div>
      </div>

      <details class="text-sm">
        <summary class="w-fit cursor-pointer text-xs font-medium text-fg-secondary">
          Ver los datos en una tabla
        </summary>
        <table class="mt-2 w-full max-w-md text-left">
          <thead class="text-xs text-fg-muted">
            <tr>
              <th scope="col" class="py-1 font-medium">{{ nombreEtiqueta() }}</th>
              <th scope="col" class="py-1 text-right font-medium">{{ nombreValor() }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            @for (c of datos(); track c.etiqueta) {
              <tr>
                <td class="py-1">
                  {{ c.etiqueta }}
                  @if (c.detalle) {
                    <span class="text-fg-muted">· {{ c.detalle }}</span>
                  }
                </td>
                <td class="py-1 text-right">{{ formatoValor()(c.valor) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </details>
    </figure>
  `,
})
export class GraficoColumnas {
  readonly datos = input.required<Columna[]>();
  readonly titulo = input.required<string>();
  readonly formatoValor = input<(n: number) => string>((n) => String(n));
  readonly formatoEje = input<(n: number) => string>((n) => String(n));
  readonly nombreEtiqueta = input('Período');
  readonly nombreValor = input('Valor');

  private readonly tope = computed(() =>
    topeRedondo(Math.max(0, ...this.datos().map((d) => d.valor))),
  );
  protected readonly columnas = computed(() =>
    this.datos().map((d) => ({ ...d, altura: (Math.max(d.valor, 0) / this.tope()) * 100 })),
  );
  /** 0, 1/4, 1/2, 3/4 y el tope. */
  protected readonly marcas = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({ valor: this.tope() * f, altura: f * 100 })),
  );
}
