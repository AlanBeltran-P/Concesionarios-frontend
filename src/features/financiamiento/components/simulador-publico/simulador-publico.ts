import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { PlanesService } from '../../services/planes.service';

/**
 * Simulador de cuotas del sitio público (RF-29): plan, anticipo y cuotas para un precio.
 * Si no se le pasa precio, deja escribirlo (página de Financiación).
 */
@Component({
  selector: 'app-simulador-publico',
  template: `
    <section class="tarjeta flex flex-col gap-5 p-6" aria-labelledby="titulo-simulador">
      <div class="flex flex-col gap-1">
        <h2 id="titulo-simulador" class="text-h3">Simulá tu financiación</h2>
        <p class="text-sm text-fg-muted">Cuotas fijas en pesos. Sujeto a aprobación crediticia.</p>
      </div>

      @if (!planes().length) {
        <p class="text-sm text-fg-muted">
          {{ cargandoPlanes() ? 'Cargando planes…' : 'Por ahora no hay planes de financiación.' }}
        </p>
      } @else {
        @if (precio() === null) {
          <label class="flex flex-col gap-1.5">
            <span class="etiqueta">Precio del vehículo ($)</span>
            <input
              type="number"
              min="1"
              class="campo"
              placeholder="25000000"
              [value]="precioEscrito() || ''"
              (change)="precioEscrito.set(numero($any($event.target).value))"
            />
          </label>
        }
        <label class="flex flex-col gap-1.5">
          <span class="etiqueta">Plan</span>
          <select class="campo" (change)="elegirPlan(numero($any($event.target).value))">
            @for (p of planes(); track p.id) {
              <option [value]="p.id" [selected]="planId() === p.id">
                {{ p.nombre }} · {{ p.tasaAnual }} % anual
              </option>
            }
          </select>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="etiqueta">Anticipo ($)</span>
            <input
              type="number"
              min="0"
              class="campo"
              [value]="anticipo()"
              (change)="anticipo.set(numero($any($event.target).value))"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="etiqueta">Cuotas</span>
            <select class="campo" (change)="cuotas.set(numero($any($event.target).value))">
              @for (n of plan()?.plazos ?? []; track n) {
                <option [value]="n" [selected]="cuotas() === n">{{ n }}</option>
              }
            </select>
          </label>
        </div>
        @if (plan(); as p) {
          <p class="-mt-2 text-xs text-fg-muted">
            Anticipo mínimo: {{ p.porcentajeAnticipoMinimo }} %{{ precioBase() ? ' (' + formatearPrecio(anticipoMinimo()) + ')' : '' }}.
            Podés entregar tu usado como parte.
          </p>
        }

        @if (error(); as mensaje) {
          <p role="alert" class="error-campo">{{ mensaje }}</p>
        }
        <div
          class="flex items-center justify-between gap-3 rounded-lg bg-inverse px-5 py-4 text-fg-inverse"
          aria-live="polite"
        >
          <div class="flex flex-col">
            <span class="text-xs text-fg-inverse-muted">Cuota estimada</span>
            <span class="text-price">
              {{ simulacion() ? formatearPrecio(simulacion()!.valorCuota) + ' / mes' : '—' }}
            </span>
          </div>
          @if (simulacion(); as s) {
            <div class="flex flex-col text-right text-xs text-fg-inverse-muted">
              <span>{{ s.cantidadCuotas }} cuotas</span>
              <span>Financiás {{ formatearPrecio(s.montoFinanciado) }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class SimuladorPublico {
  private readonly servicio = inject(PlanesService);

  /** Precio del vehículo; null = el usuario lo escribe. */
  readonly precio = input<number | null>(null);

  protected readonly formatearPrecio = formatearPrecio;

  private readonly planesRecurso = rxResource({ stream: () => this.servicio.listar() });
  protected readonly planes = computed(() => valorDe(this.planesRecurso) ?? []);
  protected readonly cargandoPlanes = computed(() => this.planesRecurso.isLoading());

  protected readonly precioEscrito = signal(0);
  protected readonly precioBase = computed(() => this.precio() ?? this.precioEscrito());
  protected readonly planId = signal<number | null>(null);
  protected readonly plan = computed(
    () => this.planes().find((p) => p.id === this.planId()) ?? this.planes()[0],
  );
  protected readonly anticipo = signal(0);
  protected readonly cuotas = signal<number | null>(null);
  protected readonly anticipoMinimo = computed(() => {
    const p = this.plan();
    return p ? Math.ceil(this.precioBase() * p.porcentajeAnticipoMinimo) / 100 : 0;
  });

  private readonly simulacionRecurso = rxResource({
    params: () => {
      const p = this.plan();
      const cuotas = this.cuotas();
      const precio = this.precioBase();
      if (!p || !cuotas || precio <= 0) return undefined;
      return { planId: p.id, precio, anticipo: this.anticipo(), cantidadCuotas: cuotas };
    },
    stream: ({ params }) => this.servicio.simular(params),
  });
  protected readonly simulacion = computed(() => valorDe(this.simulacionRecurso));
  protected readonly error = computed(() => {
    const e = this.simulacionRecurso.error();
    return e ? mensajeDeError(e) : null;
  });

  constructor() {
    // Al cambiar de plan o de precio: el anticipo mínimo y el plazo más largo del plan.
    effect(() => {
      const p = this.plan();
      const minimo = this.anticipoMinimo();
      if (!p) return;
      untracked(() => {
        this.anticipo.set(minimo);
        if (!p.plazos.includes(this.cuotas() ?? -1)) this.cuotas.set(Math.max(...p.plazos));
      });
    });
  }

  protected elegirPlan(id: number): void {
    this.planId.set(id);
  }

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }
}
