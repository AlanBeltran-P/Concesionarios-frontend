import { Component } from '@angular/core';

/** Lugar reservado para una tarjeta del catálogo mientras cargan los vehículos. */
@Component({
  selector: 'app-tarjeta-esqueleto',
  host: { 'aria-hidden': 'true', class: 'block h-full' },
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div class="esqueleto aspect-[34/21] rounded-none"></div>
      <div class="flex flex-1 flex-col gap-3 p-5">
        <div class="flex flex-col gap-2">
          <div class="esqueleto h-3 w-20"></div>
          <div class="esqueleto h-5 w-36"></div>
        </div>
        <div class="flex gap-4">
          <div class="esqueleto h-3.5 w-12"></div>
          <div class="esqueleto h-3.5 w-20"></div>
          <div class="esqueleto h-3.5 w-16"></div>
        </div>
        <div class="mt-auto flex items-end justify-between border-t border-muted pt-3">
          <div class="flex flex-col gap-2">
            <div class="esqueleto h-3 w-12"></div>
            <div class="esqueleto h-6 w-32"></div>
          </div>
          <div class="esqueleto size-9 rounded-full"></div>
        </div>
      </div>
    </div>
  `,
})
export class TarjetaEsqueleto {}
