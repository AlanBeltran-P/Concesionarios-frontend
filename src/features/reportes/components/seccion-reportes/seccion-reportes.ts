import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReporteCarteraComponent } from '../reporte-cartera/reporte-cartera';
import { ReporteInventarioComponent } from '../reporte-inventario/reporte-inventario';
import { ReporteVentasComponent } from '../reporte-ventas/reporte-ventas';

type Vista = 'ventas' | 'inventario' | 'cartera';

const VISTAS: { vista: Vista; texto: string }[] = [
  { vista: 'ventas', texto: 'Ventas' },
  { vista: 'inventario', texto: 'Inventario' },
  { vista: 'cartera', texto: 'Cartera y morosos' },
];

/** Reportes del ADMIN (/panel/reportes?vista=...). */
@Component({
  selector: 'app-seccion-reportes',
  imports: [
    RouterLink,
    ReporteVentasComponent,
    ReporteInventarioComponent,
    ReporteCarteraComponent,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-h2">Reportes</h1>
        <p class="text-sm text-fg-muted">Ventas, inventario y cartera de créditos</p>
      </header>

      <nav class="flex w-fit gap-1 rounded-md bg-subtle p-1" aria-label="Reportes">
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

      @switch (actual()) {
        @case ('inventario') {
          <app-reporte-inventario />
        }
        @case ('cartera') {
          <app-reporte-cartera />
        }
        @default {
          <app-reporte-ventas />
        }
      }
    </div>
  `,
})
export class SeccionReportes {
  readonly vista = input<string>();
  protected readonly vistas = VISTAS;
  protected readonly actual = computed<Vista>(() =>
    VISTAS.some((v) => v.vista === this.vista()) ? (this.vista() as Vista) : 'ventas',
  );
}
