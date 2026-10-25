import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_COTIZACION_CLIENTE, cotizacionReservable } from '../../logic';
import { Cotizacion } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';

/** Mis cotizaciones (/cuenta/cotizaciones): lo que pidió el cliente y lo que le respondieron. */
@Component({
  selector: 'app-mis-cotizaciones',
  imports: [RouterLink, Etiqueta, Icono, Paginado],
  template: `
    <section class="flex flex-col gap-4" aria-labelledby="t-cotizaciones">
      <h2 id="t-cotizaciones" class="sr-only">Mis cotizaciones</h2>

      @if (error(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{{ mensaje }}</p>
      }
      @if (errorAccion(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{{ mensaje }}</p>
      }

      @for (c of cotizaciones(); track c.id) {
        <article class="tarjeta flex flex-col gap-4 p-5 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 flex-col gap-1.5">
              <app-etiqueta class="w-fit" [tono]="estado[c.estado].tono">{{ estado[c.estado].texto }}</app-etiqueta>
              <h3 class="text-h4">
                <a [routerLink]="['/vehiculos', c.vehiculoId]" class="hover:underline">{{ c.vehiculo }}</a>
              </h3>
              <p class="text-sm text-fg-muted">Pedida el {{ fecha(c.fechaSolicitud) }}</p>
            </div>
            <div class="flex flex-col sm:items-end">
              <span class="text-xs text-fg-muted">{{ c.precioFinal !== null ? 'Precio cotizado' : 'Precio de lista' }}</span>
              <span class="font-display text-h3">{{ precio(c.precioFinal ?? c.precioLista) }}</span>
              @if (c.precioFinal !== null && c.precioFinal < c.precioLista) {
                <span class="text-sm text-fg-muted line-through">{{ precio(c.precioLista) }}</span>
              }
            </div>
          </div>

          @if (c.mensajeCliente) {
            <div class="flex flex-col gap-1 rounded-md bg-subtle px-4 py-3 text-sm">
              <span class="text-xs font-medium text-fg-muted">Tu consulta</span>
              <p class="whitespace-pre-line">{{ c.mensajeCliente }}</p>
            </div>
          }
          @if (c.respuestaVendedor) {
            <div class="flex flex-col gap-1 rounded-md border border-line px-4 py-3 text-sm">
              <span class="text-xs font-medium text-fg-muted">
                Respuesta{{ c.vendedorNombre ? ' de ' + c.vendedorNombre : '' }}
              </span>
              <p class="whitespace-pre-line">{{ c.respuestaVendedor }}</p>
              @if (c.descuento || c.valorTradeIn) {
                <ul class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-fg-secondary">
                  @if (c.descuento) {
                    <li>Descuento: {{ precio(c.descuento) }}</li>
                  }
                  @if (c.valorTradeIn) {
                    <li>Tu usado: {{ precio(c.valorTradeIn) }}</li>
                  }
                </ul>
              }
            </div>
          }

          @if (c.estado === 'SOLICITADA') {
            <p class="text-sm text-fg-muted">Un vendedor te va a responder pronto. Te avisamos por email.</p>
          }
          @if (reservable(c)) {
            <div class="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-fg-secondary">
                @if (c.estado === 'ACEPTADA') {
                  La aceptaste: un vendedor te contacta para cerrar la compra.
                }
                Este precio vale hasta el {{ fecha(c.fechaValidez!) }}.
              </p>
              <div class="flex flex-wrap gap-2">
                @if (c.estado === 'RESPONDIDA') {
                  <button type="button" class="boton boton-secundario" [disabled]="ocupada() === c.id" (click)="decidir(c, 'rechazar')">
                    Rechazar
                  </button>
                  <button type="button" class="boton boton-secundario" [disabled]="ocupada() === c.id" (click)="decidir(c, 'aceptar')">
                    Aceptar
                  </button>
                }
                <a
                  [routerLink]="['/vehiculos', c.vehiculoId]"
                  [queryParams]="{ cotizacion: c.id }"
                  class="boton boton-primario"
                >
                  Reservar con este precio
                </a>
              </div>
            </div>
          }
        </article>
      } @empty {
        <div class="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
          @if (cargando()) {
            <span class="text-fg-muted">Cargando…</span>
          } @else if (!error()) {
            <span class="grid size-12 place-items-center rounded-full bg-subtle text-fg-muted">
              <app-icono nombre="documento" class="size-6" />
            </span>
            <p class="font-medium">Todavía no pediste cotizaciones</p>
            <p class="max-w-sm text-sm text-fg-muted">
              Entrá a un vehículo del catálogo y tocá "Solicitar cotización".
            </p>
            <a routerLink="/" class="boton boton-primario">Ver el catálogo</a>
          }
        </div>
      }

      <app-paginado [info]="datos()?.page" (cambiar)="pagina.set($event)" />
    </section>
  `,
})
export class MisCotizaciones {
  private readonly servicio = inject(CotizacionesService);

  protected readonly estado = ESTADO_COTIZACION_CLIENTE;
  protected readonly precio = formatearPrecio;
  protected readonly fecha = formatearFecha;
  protected readonly reservable = (c: Cotizacion) => cotizacionReservable(c);

  protected readonly pagina = signal(0);
  private readonly recurso = rxResource({
    params: () => this.pagina(),
    stream: ({ params }) => this.servicio.mias(params, 10),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cotizaciones = computed(() => this.datos()?.content ?? []);
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  protected readonly ocupada = signal<number | null>(null);
  protected readonly errorAccion = signal<string | null>(null);

  protected decidir(c: Cotizacion, decision: 'aceptar' | 'rechazar'): void {
    if (decision === 'rechazar' && !confirm('¿Rechazar esta cotización?')) return;
    this.ocupada.set(c.id);
    this.errorAccion.set(null);
    this.servicio.decidir(c.id, decision).subscribe({
      next: () => {
        this.ocupada.set(null);
        this.recurso.reload();
      },
      error: (err: unknown) => {
        this.errorAccion.set(mensajeDeError(err));
        this.ocupada.set(null);
      },
    });
  }
}
