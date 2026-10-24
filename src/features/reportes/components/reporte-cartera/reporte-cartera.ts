import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ReportesService } from '../../services/reportes.service';

/** Cartera de créditos y morosos (RF-41). */
@Component({
  selector: 'app-reporte-cartera',
  imports: [RouterLink],
  template: `
    @if (error(); as mensaje) {
      <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
        {{ mensaje }}
      </p>
    } @else if (datos(); as d) {
      <div class="flex flex-col gap-6">
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Totales">
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Cobrado</span>
            <span class="text-price">{{ formatearPrecio(d.cobrado) }}</span>
            <span class="text-xs text-fg-muted">{{ d.cuotasPagadas }} cuotas pagadas</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Por cobrar al día</span>
            <span class="text-price">{{ formatearPrecio(d.pendiente) }}</span>
            <span class="text-xs text-fg-muted">{{ d.cuotasPendientes }} cuotas sin vencer</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Vencido</span>
            <span class="text-price" [class.text-danger]="d.vencido > 0">{{
              formatearPrecio(d.vencido)
            }}</span>
            <span class="text-xs text-fg-muted">{{ d.cuotasVencidas }} cuotas vencidas</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Mora acumulada</span>
            <span class="text-price">{{ formatearPrecio(d.moraTotal) }}</span>
          </div>
        </section>

        <section class="tarjeta overflow-hidden" aria-labelledby="t-morosos">
          <h2 id="t-morosos" class="border-b border-line px-5 py-4 text-h4">Morosos</h2>
          <table class="w-full text-left text-sm">
            <thead
              class="bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
            >
              <tr>
                <th scope="col" class="px-5 py-3">Cliente</th>
                <th scope="col" class="hidden px-5 py-3 md:table-cell">Debe desde</th>
                <th scope="col" class="hidden px-5 py-3 text-right sm:table-cell">Atraso</th>
                <th scope="col" class="px-5 py-3 text-right">Deuda vencida</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (m of d.morosos; track m.clienteId) {
                <tr>
                  <td class="px-5 py-3">
                    <a
                      [routerLink]="['/panel/clientes', m.clienteId]"
                      class="font-medium underline"
                    >
                      {{ m.clienteNombre }}
                    </a>
                    <span class="block text-xs text-fg-muted">
                      {{ m.cuotasVencidas }}
                      {{ m.cuotasVencidas === 1 ? 'cuota vencida' : 'cuotas vencidas' }}
                    </span>
                  </td>
                  <td class="hidden px-5 py-3 text-fg-secondary md:table-cell">
                    {{ formatearFecha(m.vencimientoMasAntiguo) }}
                  </td>
                  <td class="hidden px-5 py-3 text-right font-medium text-danger sm:table-cell">
                    {{ m.diasMaximoAtraso }} días
                  </td>
                  <td class="px-5 py-3 text-right font-display font-semibold whitespace-nowrap">
                    {{ formatearPrecio(m.deudaVencida) }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-5 py-8 text-center text-fg-muted">
                    No hay clientes morosos.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    } @else {
      <p class="py-14 text-center text-fg-muted">Cargando reporte…</p>
    }
  `,
})
export class ReporteCarteraComponent {
  private readonly servicio = inject(ReportesService);

  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;

  private readonly recurso = rxResource({ stream: () => this.servicio.cartera() });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });
}
