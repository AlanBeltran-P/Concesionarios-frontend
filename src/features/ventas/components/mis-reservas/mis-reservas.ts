import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_RESERVA, SENA_MINIMA_PORCENTAJE } from '../../logic';
import { VentasService } from '../../services/ventas.service';

/** Mis reservas (/cuenta/reservas). */
@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, Etiqueta, Icono, Paginado],
  template: `
    <section class="flex flex-col gap-4" aria-labelledby="t-reservas">
      <h2 id="t-reservas" class="sr-only">Mis reservas</h2>

      @if (error(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{{ mensaje }}</p>
      }

      @for (r of reservas(); track r.id) {
        <article class="tarjeta flex flex-col gap-4 p-5 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 flex-col gap-1.5">
              <app-etiqueta class="w-fit" [tono]="estado[r.estado].tono">{{ estado[r.estado].texto }}</app-etiqueta>
              <h3 class="text-h4">
                <a [routerLink]="['/vehiculos', r.vehiculoId]" class="hover:underline">{{ r.vehiculo }}</a>
              </h3>
              <p class="text-sm text-fg-muted">
                Reservado el {{ fecha(r.fechaReserva) }}
                @if (r.cotizacionId) {
                  · con precio cotizado
                }
              </p>
            </div>
            <div class="flex flex-col sm:items-end">
              <span class="text-xs text-fg-muted">Seña</span>
              <span class="font-display text-h3">{{ precio(r.montoAnticipo) }}</span>
            </div>
          </div>

          @switch (r.estado) {
            @case ('ACTIVA') {
              <p class="rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
                El auto queda apartado para vos hasta el {{ fecha(r.fechaVencimiento) }}. Acercate al
                local con la seña para cerrar la compra; si no, la reserva vence sola.
              </p>
            }
            @case ('CONVERTIDA') {
              <p class="text-sm text-fg-secondary">
                Ya compraste este auto: la seña se descontó del precio.
                <a routerLink="/cuenta" class="font-medium underline">Ver mis compras</a>
              </p>
            }
            @case ('ANULADA') {
              @if (r.motivoAnulacion) {
                <p class="text-sm text-fg-secondary">Motivo: {{ r.motivoAnulacion }}</p>
              }
            }
          }
        </article>
      } @empty {
        <div class="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
          @if (cargando()) {
            <span class="text-fg-muted">Cargando…</span>
          } @else if (!error()) {
            <span class="grid size-12 place-items-center rounded-full bg-subtle text-fg-muted">
              <app-icono nombre="calendario" class="size-6" />
            </span>
            <p class="font-medium">No tenés reservas</p>
            <p class="max-w-sm text-sm text-fg-muted">
              Desde la página de un vehículo podés reservarlo con una seña del {{ senaMinima }} % del precio.
            </p>
            <a routerLink="/" class="boton boton-primario">Ver el catálogo</a>
          }
        </div>
      }

      <app-paginado [info]="datos()?.page" (cambiar)="pagina.set($event)" />
    </section>
  `,
})
export class MisReservas {
  private readonly servicio = inject(VentasService);

  protected readonly estado = ESTADO_RESERVA;
  protected readonly senaMinima = SENA_MINIMA_PORCENTAJE;
  protected readonly precio = formatearPrecio;
  protected readonly fecha = formatearFecha;

  protected readonly pagina = signal(0);
  private readonly recurso = rxResource({
    params: () => this.pagina(),
    stream: ({ params }) => this.servicio.misReservas(params, 10),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly reservas = computed(() => this.datos()?.content ?? []);
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });
}
