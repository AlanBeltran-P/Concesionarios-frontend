import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../shared/ui/icono/icono';

/**
 * Marco de las pantallas de acceso (login, registro, recuperar contraseña):
 * panel de marca a la izquierda en pantallas grandes y el formulario a la derecha.
 */
@Component({
  selector: 'app-marco-auth',
  imports: [RouterLink, Icono],
  template: `
    <div class="flex min-h-screen bg-surface">
      <aside class="hidden w-[560px] shrink-0 flex-col justify-between bg-inverse px-14 py-14 lg:flex xl:w-[640px] xl:px-16">
        <a routerLink="/" class="flex items-center gap-2.5 text-fg-inverse">
          <span class="grid size-8 place-items-center rounded-sm bg-surface text-fg">
            <app-icono nombre="auto" class="size-5" />
          </span>
          <span class="font-display text-h4">Concesionaria</span>
        </a>

        <div class="flex flex-col gap-5">
          <h1 class="max-w-[500px] text-h1 text-fg-inverse">
            Tu próximo auto, con cuotas fijas y en un solo lugar.
          </h1>
          <p class="max-w-[480px] text-lg text-fg-inverse-muted">
            Pedí cotizaciones, reservá con seña y seguí las cuotas de tu financiación desde tu
            cuenta.
          </p>
          <ul class="flex flex-col gap-3.5 pt-3 text-fg-inverse">
            @for (item of puntos; track item.texto) {
              <li class="flex items-center gap-3">
                <span class="grid size-[34px] place-items-center rounded-[8px] bg-inverse-soft">
                  <app-icono [nombre]="item.icono" class="size-[18px]" />
                </span>
                {{ item.texto }}
              </li>
            }
          </ul>
        </div>

        <p class="text-xs font-medium text-fg-inverse-muted">© {{ anio }} Concesionaria</p>
      </aside>

      <main class="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <a
          routerLink="/"
          class="flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-fg-secondary hover:text-fg"
        >
          <app-icono nombre="flecha-izquierda" class="size-4" />
          Volver al sitio
        </a>
        <div class="flex flex-1 items-center justify-center py-10">
          <div class="w-full max-w-[400px]">
            <ng-content />
          </div>
        </div>
      </main>
    </div>
  `,
})
export class MarcoAuth {
  protected readonly anio = new Date().getFullYear();
  protected readonly puntos = [
    { icono: 'auto', texto: 'Autos 0 km y usados con fotos y precio' },
    { icono: 'tarjeta', texto: 'Planes de financiación en pesos' },
    { icono: 'escudo', texto: 'Tus datos protegidos' },
  ] as const;
}
