import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EsqueletoLineas } from '../../../../shared/ui/carga/esqueleto-lineas';
import { Icono } from '../../../../shared/ui/icono/icono';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { PlanesService } from '../../services/planes.service';
import { SimuladorPublico } from '../simulador-publico/simulador-publico';

/** Página "Financiación" del sitio público: los planes vigentes y un simulador con precio libre. */
@Component({
  selector: 'app-financiacion-publica',
  imports: [EsqueletoLineas, RouterLink, Icono, SimuladorPublico],
  template: `
    <section class="bg-inverse text-fg-inverse">
      <div class="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-14 pb-12 sm:px-8">
        <p class="text-xs font-semibold tracking-[0.08em] text-fg-inverse-muted uppercase">
          Financiación
        </p>
        <h1 class="text-h1">Cuotas fijas en pesos</h1>
        <p class="max-w-2xl text-lg text-fg-inverse-muted">
          Elegí el plan que mejor te quede. Podés entregar tu usado como parte del anticipo.
        </p>
      </div>
    </section>

    <div
      class="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start lg:gap-10"
    >
      <section class="flex min-w-0 flex-col gap-5" aria-labelledby="titulo-planes">
        <h2 id="titulo-planes" class="text-h2">Planes disponibles</h2>
        @if (error(); as mensaje) {
          <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{{ mensaje }}</p>
        } @else {
          <ul class="grid gap-4 sm:grid-cols-2">
            @for (p of planes(); track p.id) {
              <li class="tarjeta flex flex-col gap-4 p-6">
                <div class="flex flex-col gap-1">
                  <h3 class="text-h4">{{ p.nombre }}</h3>
                  @if (p.descripcion) {
                    <p class="text-sm text-fg-muted">{{ p.descripcion }}</p>
                  }
                </div>
                <dl class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-0.5 rounded-md bg-subtle px-3 py-2.5">
                    <dt class="text-xs text-fg-muted">Tasa anual</dt>
                    <dd class="font-display text-h4">{{ p.tasaAnual }} %</dd>
                  </div>
                  <div class="flex flex-col gap-0.5 rounded-md bg-subtle px-3 py-2.5">
                    <dt class="text-xs text-fg-muted">Anticipo mínimo</dt>
                    <dd class="font-display text-h4">{{ p.porcentajeAnticipoMinimo }} %</dd>
                  </div>
                </dl>
                <div class="flex flex-col gap-2">
                  <span class="text-xs font-medium text-fg-muted">Cuotas</span>
                  <ul class="flex flex-wrap gap-2">
                    @for (n of p.plazos; track n) {
                      <li class="rounded-full border border-line px-3 py-1 text-sm">{{ n }}</li>
                    }
                  </ul>
                </div>
              </li>
            } @empty {
              @if (cargando()) {
                @for (i of [0, 1]; track i) {
                  <li class="tarjeta p-6">
                    <app-esqueleto-lineas [lineas]="5" texto="Cargando planes…" />
                  </li>
                }
              } @else {
                <li class="tarjeta col-span-full px-6 py-12 text-center text-fg-muted">
                  Por ahora no hay planes de financiación.
                </li>
              }
            }
          </ul>
        }

        <ul class="flex flex-col gap-3 pt-2 text-sm text-fg-secondary">
          <li class="flex items-center gap-2.5">
            <app-icono nombre="check" class="size-[18px] shrink-0" />
            La cuota no cambia durante todo el plan.
          </li>
          <li class="flex items-center gap-2.5">
            <app-icono nombre="auto" class="size-[18px] shrink-0" />
            Tu usado se tasa en el momento y se descuenta del anticipo.
          </li>
          <li class="flex items-center gap-2.5">
            <app-icono nombre="escudo" class="size-[18px] shrink-0" />
            Sujeto a aprobación crediticia.
          </li>
        </ul>
      </section>

      <div class="flex flex-col gap-3 lg:sticky lg:top-24">
        <app-simulador-publico />
        <a routerLink="/" class="boton boton-primario">
          Ver vehículos
          <app-icono nombre="flecha-derecha" class="size-4" />
        </a>
      </div>
    </div>
  `,
})
export class FinanciacionPublica {
  private readonly servicio = inject(PlanesService);

  private readonly recurso = rxResource({ stream: () => this.servicio.listar() });
  protected readonly planes = computed(() => valorDe(this.recurso) ?? []);
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });
}
