import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { NOMBRE_GRUPO, precioCompacto } from '../../logic';
import { ReportesService } from '../../services/reportes.service';
import { EsqueletoFicha } from '../../../../shared/ui/carga/esqueleto-ficha';

/** Inventario por estado y antigüedad en stock (RF-40). */
@Component({
  selector: 'app-reporte-inventario',
  imports: [EsqueletoFicha, RouterLink],
  template: `
    @if (error(); as mensaje) {
      <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
        {{ mensaje }}
      </p>
    } @else if (datos(); as d) {
      <div class="flex flex-col gap-6">
        <section class="grid gap-4 sm:grid-cols-3" aria-label="Totales">
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">En stock</span>
            <span class="text-price">{{ d.enStock }}</span>
            <span class="text-xs text-fg-muted">disponibles y reservados</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Valor del stock</span>
            <span class="text-price">{{ formatearPrecio(d.valorStock) }}</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Días promedio en stock</span>
            <span class="text-price">{{ redondear(d.diasPromedioEnStock) }}</span>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-3">
          <section class="tarjeta flex flex-col gap-4 p-5" aria-labelledby="t-estado">
            <h2 id="t-estado" class="text-h4">Por estado y condición</h2>
            @for (grupo of [d.porEstado, d.porCondicion]; track $index) {
              <dl
                class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t border-line pt-3 text-sm first-of-type:border-t-0 first-of-type:pt-0"
              >
                @for (par of entradas(grupo); track par[0]) {
                  <dt class="text-fg-secondary">{{ nombreGrupo[par[0]] ?? par[0] }}</dt>
                  <dd class="text-right font-medium">{{ par[1] }}</dd>
                } @empty {
                  <dt class="text-fg-muted">Sin vehículos</dt>
                  <dd></dd>
                }
              </dl>
            }
          </section>

          <section
            class="tarjeta flex flex-col gap-4 p-5 lg:col-span-2"
            aria-labelledby="t-antiguedad"
          >
            <h2 id="t-antiguedad" class="text-h4">Antigüedad en stock</h2>
            <ol class="flex flex-col gap-4">
              @for (r of d.antiguedad; track r.rango) {
                <li class="flex flex-col gap-1.5">
                  <div class="flex items-baseline justify-between gap-3 text-sm">
                    <span class="font-medium">{{ r.rango }}</span>
                    <span class="text-fg-secondary">
                      {{ r.cantidad }} {{ r.cantidad === 1 ? 'vehículo' : 'vehículos' }} ·
                      {{ precioCompacto(r.valor) }}
                    </span>
                  </div>
                  <div class="h-1.5 rounded-full bg-subtle" aria-hidden="true">
                    <div
                      class="h-full rounded-full bg-primary"
                      [style.width.%]="(r.cantidad / maxRango()) * 100"
                    ></div>
                  </div>
                </li>
              }
            </ol>
          </section>
        </div>

        <section class="tarjeta overflow-hidden" aria-labelledby="t-antiguos">
          <h2 id="t-antiguos" class="border-b border-line px-5 py-4 text-h4">
            Los que más tiempo llevan
          </h2>
          <table class="w-full text-left text-sm">
            <thead
              class="bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
            >
              <tr>
                <th scope="col" class="px-5 py-3">Vehículo</th>
                <th scope="col" class="hidden px-5 py-3 md:table-cell">Ingresó</th>
                <th scope="col" class="px-5 py-3 text-right">Días</th>
                <th scope="col" class="hidden px-5 py-3 text-right sm:table-cell">Precio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (v of d.masAntiguos; track v.vehiculoId) {
                <tr>
                  <td class="px-5 py-3">
                    <a
                      [routerLink]="['/panel/vehiculos', v.vehiculoId]"
                      class="font-medium underline"
                    >
                      {{ v.marca }} {{ v.modelo }} {{ v.anio }}
                    </a>
                    <span class="block text-xs text-fg-muted">
                      {{ nombreGrupo[v.condicion] ?? v.condicion }} ·
                      {{ nombreGrupo[v.estado] ?? v.estado }}
                    </span>
                  </td>
                  <td class="hidden px-5 py-3 text-fg-secondary md:table-cell">
                    {{ formatearFecha(v.fechaIngreso) }}
                  </td>
                  <td class="px-5 py-3 text-right font-medium">{{ v.diasEnStock }}</td>
                  <td class="hidden px-5 py-3 text-right whitespace-nowrap sm:table-cell">
                    {{ formatearPrecio(v.precio) }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-5 py-8 text-center text-fg-muted">
                    No hay vehículos en stock.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    } @else {
      <app-esqueleto-ficha texto="Cargando reporte…" [titulo]="false" />
    }
  `,
})
export class ReporteInventarioComponent {
  private readonly servicio = inject(ReportesService);

  protected readonly nombreGrupo = NOMBRE_GRUPO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly precioCompacto = precioCompacto;

  private readonly recurso = rxResource({ stream: () => this.servicio.inventario() });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });
  protected readonly maxRango = computed(() =>
    Math.max(1, ...(this.datos()?.antiguedad.map((r) => r.cantidad) ?? [])),
  );

  protected entradas(grupo: Record<string, number>): [string, number][] {
    return Object.entries(grupo);
  }

  protected redondear(n: number): number {
    return Math.round(n);
  }
}
