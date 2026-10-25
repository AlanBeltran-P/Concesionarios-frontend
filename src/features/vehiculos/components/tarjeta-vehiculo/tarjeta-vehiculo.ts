import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { urlDelBackend } from '../../../../shared/utils/http';
import { ETIQUETA_CONDICION } from '../../logic';
import { VehiculoResumen } from '../../model';

/** Tarjeta del catálogo público (componente VehicleCard del Figma). */
@Component({
  selector: 'app-tarjeta-vehiculo',
  imports: [RouterLink, Icono],
  template: `
    <article
      class="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition hover:shadow-md"
    >
      <div
        class="relative grid aspect-[34/21] place-items-center bg-gradient-to-b from-subtle to-muted text-fg-disabled"
      >
        @if (v().imagenPrincipalUrl; as img) {
          <img [src]="url(img)" alt="" loading="lazy" class="absolute inset-0 size-full object-cover" />
        } @else {
          <app-icono nombre="auto" class="size-14" />
        }
        <span
          class="absolute top-3.5 left-3.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-fg"
        >
          {{ condicion[v().condicion] }}
        </span>
      </div>
      <div class="flex flex-1 flex-col gap-3 p-5">
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-semibold tracking-[0.08em] text-fg-muted uppercase">
            {{ v().marca }}
          </span>
          <h3 class="text-h4">
            <!-- El enlace cubre toda la tarjeta -->
            <a [routerLink]="['/vehiculos', v().id]" class="after:absolute after:inset-0">
              {{ v().modelo }}
            </a>
          </h3>
        </div>
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-secondary">
          <li class="flex items-center gap-1.5">
            <app-icono nombre="calendario" class="size-4 text-fg-muted" />
            {{ v().anio }}
          </li>
          <li class="flex items-center gap-1.5">
            <app-icono nombre="velocimetro" class="size-4 text-fg-muted" />
            {{ km(v().kilometraje) }}
          </li>
          <li class="flex items-center gap-1.5">
            <app-icono nombre="auto" class="size-4 text-fg-muted" />
            {{ v().categoria }}
          </li>
        </ul>
        <div class="mt-auto flex items-end justify-between gap-3 border-t border-muted pt-3">
          <div class="flex flex-col">
            <span class="text-xs text-fg-muted">Precio</span>
            <span class="text-price">{{ precio(v().precio) }}</span>
          </div>
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full border border-line text-fg-secondary transition group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
            aria-hidden="true"
          >
            <app-icono nombre="flecha-derecha" class="size-4" />
          </span>
        </div>
      </div>
    </article>
  `,
})
export class TarjetaVehiculo {
  readonly v = input.required<VehiculoResumen>();
  protected readonly condicion = ETIQUETA_CONDICION;
  protected readonly precio = formatearPrecio;
  protected readonly km = formatearKm;
  protected readonly url = urlDelBackend;
}
