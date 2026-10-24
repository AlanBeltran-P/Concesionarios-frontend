import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { Simulacion } from '../../model';
import { PlanesService } from '../../services/planes.service';

/** Simulador de cuotas (RF-29): sistema francés, con las reglas del plan. */
@Component({
  selector: 'app-simulador-cuotas',
  templateUrl: './simulador-cuotas.html',
})
export class SimuladorCuotas {
  private readonly servicio = inject(PlanesService);

  protected readonly formatearPrecio = formatearPrecio;

  private readonly planesRecurso = rxResource({ stream: () => this.servicio.listar() });
  protected readonly planes = computed(() => valorDe(this.planesRecurso) ?? []);

  protected readonly planId = signal<number | null>(null);
  protected readonly precio = signal(0);
  protected readonly anticipo = signal(0);
  protected readonly cuotas = signal<number | null>(null);
  protected readonly plan = computed(() => this.planes().find((p) => p.id === this.planId()));
  protected readonly anticipoMinimo = computed(() => {
    const p = this.plan();
    return p ? Math.ceil(this.precio() * p.porcentajeAnticipoMinimo) / 100 : 0;
  });

  protected readonly simulacion = signal<Simulacion | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly calculando = signal(false);

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }

  protected elegirPlan(valor: string): void {
    this.planId.set(valor ? Number(valor) : null);
    if (!this.plan()?.plazos.includes(this.cuotas() ?? -1)) this.cuotas.set(null);
    this.simulacion.set(null);
  }

  protected simular(): void {
    const plan = this.planId();
    const cuotas = this.cuotas();
    if (!plan || !cuotas || this.precio() <= 0) {
      this.error.set('Elegí el plan, las cuotas y el precio.');
      return;
    }
    this.calculando.set(true);
    this.error.set(null);
    this.servicio
      .simular({
        planId: plan,
        cantidadCuotas: cuotas,
        precio: this.precio(),
        anticipo: this.anticipo(),
      })
      .subscribe({
        next: (s) => {
          this.simulacion.set(s);
          this.calculando.set(false);
        },
        error: (err: unknown) => {
          this.simulacion.set(null);
          this.error.set(mensajeDeError(err));
          this.calculando.set(false);
        },
      });
  }
}
