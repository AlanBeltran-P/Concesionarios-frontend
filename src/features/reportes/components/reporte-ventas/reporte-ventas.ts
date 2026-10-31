import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ATAJOS_PERIODO, AtajoPeriodo, NOMBRE_GRUPO, periodoDe, precioCompacto } from '../../logic';
import { ReportesService } from '../../services/reportes.service';
import { EsqueletoFicha } from '../../../../shared/ui/carga/esqueleto-ficha';

/** Reporte de ventas por período y vendedor (RF-39). */
@Component({
  selector: 'app-reporte-ventas',
  imports: [EsqueletoFicha, RouterLink],
  template: `
    <div class="flex flex-col gap-6">
      <nav class="flex w-fit gap-1 rounded-md bg-subtle p-1" aria-label="Período">
        @for (a of atajos; track a.valor) {
          <button
            type="button"
            class="rounded-[7px] px-3.5 py-2 text-sm font-medium whitespace-nowrap transition"
            [class.bg-surface]="atajo() === a.valor"
            [class.shadow-sm]="atajo() === a.valor"
            [class.text-fg]="atajo() === a.valor"
            [class.text-fg-secondary]="atajo() !== a.valor"
            [attr.aria-pressed]="atajo() === a.valor"
            (click)="atajo.set(a.valor)"
          >
            {{ a.texto }}
          </button>
        }
      </nav>

      @if (error(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {{ mensaje }}
        </p>
      } @else if (datos(); as d) {
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Totales">
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Ventas</span>
            <span class="text-price">{{ d.resumen.cantidadVentas }}</span>
            <span class="text-xs text-fg-muted">
              {{ d.resumen.ventasAnuladas }} anuladas · {{ d.resumen.conTradeIn }} con auto usado
            </span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Facturado</span>
            <span class="text-price">{{ formatearPrecio(d.resumen.montoTotal) }}</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Ticket promedio</span>
            <span class="text-price">{{ formatearPrecio(d.resumen.ticketPromedio) }}</span>
          </div>
          <div class="tarjeta flex flex-col gap-1 p-5">
            <span class="text-sm text-fg-muted">Comisiones</span>
            <span class="text-price">{{ formatearPrecio(d.resumen.comisiones) }}</span>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-3">
          <section class="tarjeta overflow-hidden lg:col-span-2" aria-labelledby="t-vendedor">
            <h2 id="t-vendedor" class="border-b border-line px-5 py-4 text-h4">Por vendedor</h2>
            <table class="w-full text-left text-sm">
              <thead
                class="bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
              >
                <tr>
                  <th scope="col" class="px-5 py-3">Vendedor</th>
                  <th scope="col" class="px-5 py-3 text-right">Ventas</th>
                  <th scope="col" class="px-5 py-3 text-right">Monto</th>
                  <th scope="col" class="hidden px-5 py-3 text-right sm:table-cell">Comisiones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                @for (v of d.resumen.porVendedor; track v.vendedorId) {
                  <tr>
                    <td class="px-5 py-3 font-medium">{{ v.vendedorNombre }}</td>
                    <td class="px-5 py-3 text-right">{{ v.cantidad }}</td>
                    <td class="px-5 py-3 text-right whitespace-nowrap">
                      {{ precioCompacto(v.monto) }}
                    </td>
                    <td class="hidden px-5 py-3 text-right whitespace-nowrap sm:table-cell">
                      {{ precioCompacto(v.comisiones) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-5 py-8 text-center text-fg-muted">
                      Sin ventas en el período.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <section class="tarjeta flex flex-col gap-4 p-5" aria-labelledby="t-grupos">
            <h2 id="t-grupos" class="text-h4">Cómo se vendió</h2>
            @for (grupo of [d.resumen.porFormaPago, d.resumen.porCondicion]; track $index) {
              <dl
                class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t border-line pt-3 text-sm first-of-type:border-t-0 first-of-type:pt-0"
              >
                @for (g of grupo; track g.grupo) {
                  <dt class="text-fg-secondary">{{ nombreGrupo[g.grupo] ?? g.grupo }}</dt>
                  <dd class="text-right">{{ g.cantidad }} · {{ precioCompacto(g.monto) }}</dd>
                } @empty {
                  <dt class="text-fg-muted">Sin datos</dt>
                  <dd></dd>
                }
              </dl>
            }
          </section>
        </div>

        <section class="tarjeta overflow-hidden" aria-labelledby="t-detalle">
          <h2 id="t-detalle" class="border-b border-line px-5 py-4 text-h4">Detalle</h2>
          <div class="max-h-[480px] overflow-auto">
            <table class="w-full text-left text-sm">
              <thead
                class="sticky top-0 bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
              >
                <tr>
                  <th scope="col" class="px-5 py-3">Venta</th>
                  <th scope="col" class="hidden px-5 py-3 md:table-cell">Vendedor</th>
                  <th scope="col" class="hidden px-5 py-3 lg:table-cell">Forma de pago</th>
                  <th scope="col" class="px-5 py-3 text-right">Precio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                @for (v of d.detalle; track v.ventaId) {
                  <tr [class.text-fg-muted]="v.estado === 'ANULADA'">
                    <td class="px-5 py-3">
                      <a [routerLink]="['/panel/ventas', v.ventaId]" class="font-medium underline">
                        {{ v.numeroComprobante }}
                      </a>
                      <span class="block text-xs text-fg-muted">
                        {{ formatearFecha(v.fechaVenta) }} · {{ v.vehiculo }}
                        @if (v.estado === 'ANULADA') {
                          · anulada
                        }
                      </span>
                    </td>
                    <td class="hidden px-5 py-3 md:table-cell">{{ v.vendedorNombre }}</td>
                    <td class="hidden px-5 py-3 lg:table-cell">
                      {{ nombreGrupo[v.formaPago] ?? v.formaPago }}
                      @if (v.conTradeIn) {
                        · con auto usado
                      }
                    </td>
                    <td class="px-5 py-3 text-right whitespace-nowrap">
                      {{ formatearPrecio(v.precioFinal) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-5 py-8 text-center text-fg-muted">
                      Sin ventas en el período.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <app-esqueleto-ficha texto="Cargando reporte…" [titulo]="false" [tarjetas]="0" />
      }
    </div>
  `,
})
export class ReporteVentasComponent {
  private readonly servicio = inject(ReportesService);

  protected readonly atajos = ATAJOS_PERIODO;
  protected readonly nombreGrupo = NOMBRE_GRUPO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly precioCompacto = precioCompacto;
  protected readonly atajo = signal<AtajoPeriodo>('mes');

  private readonly recurso = rxResource({
    params: () => periodoDe(this.atajo()),
    stream: ({ params }) =>
      forkJoin({
        resumen: this.servicio.ventas(params),
        detalle: this.servicio.ventasDetalle(params),
      }),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });
}
