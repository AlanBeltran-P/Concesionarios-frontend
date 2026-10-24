import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CuotasVencidas } from '../cuotas-vencidas/cuotas-vencidas';
import { ListaFinanciamientos } from '../lista-financiamientos/lista-financiamientos';
import { PlanesFinanciamiento } from '../planes-financiamiento/planes-financiamiento';
import { SimuladorCuotas } from '../simulador-cuotas/simulador-cuotas';

type Vista = 'financiamientos' | 'vencidas' | 'planes' | 'simulador';

const VISTAS: { vista: Vista; texto: string }[] = [
  { vista: 'financiamientos', texto: 'Financiamientos' },
  { vista: 'vencidas', texto: 'Cuotas vencidas' },
  { vista: 'planes', texto: 'Planes' },
  { vista: 'simulador', texto: 'Simulador' },
];

/** Sección Financiamiento (/panel/financiamiento?vista=...). */
@Component({
  selector: 'app-seccion-financiamiento',
  imports: [
    RouterLink,
    ListaFinanciamientos,
    CuotasVencidas,
    PlanesFinanciamiento,
    SimuladorCuotas,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-h2">Financiamiento</h1>
        <p class="text-sm text-fg-muted">Cuotas, pagos, mora y planes de financiación</p>
      </header>

      <div class="-mx-1 overflow-x-auto px-1">
        <nav class="flex w-max gap-1 rounded-md bg-subtle p-1" aria-label="Vistas">
          @for (v of vistas; track v.vista) {
            <a
              routerLink="."
              [queryParams]="{ vista: v.vista }"
              class="rounded-[7px] px-4 py-2 text-sm font-medium whitespace-nowrap transition"
              [class.bg-surface]="actual() === v.vista"
              [class.shadow-sm]="actual() === v.vista"
              [class.text-fg]="actual() === v.vista"
              [class.text-fg-secondary]="actual() !== v.vista"
              [attr.aria-current]="actual() === v.vista ? 'page' : null"
            >
              {{ v.texto }}
            </a>
          }
        </nav>
      </div>

      @switch (actual()) {
        @case ('vencidas') {
          <app-cuotas-vencidas />
        }
        @case ('planes') {
          <app-planes-financiamiento />
        }
        @case ('simulador') {
          <app-simulador-cuotas />
        }
        @default {
          <app-lista-financiamientos />
        }
      }
    </div>
  `,
})
export class SeccionFinanciamiento {
  readonly vista = input<string>();
  protected readonly vistas = VISTAS;
  protected readonly actual = computed<Vista>(() =>
    VISTAS.some((v) => v.vista === this.vista()) ? (this.vista() as Vista) : 'financiamientos',
  );
}
