import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO } from '../../logic';
import { EstadoVehiculo } from '../../model';

const COLORES: Record<EstadoVehiculo, string> = {
  DISPONIBLE: 'bg-success-bg text-success',
  RESERVADO: 'bg-warning-bg text-warning',
  VENDIDO: 'bg-danger-bg text-danger',
};

/** Etiqueta de color con el estado del vehículo. Si está dado de baja, eso pesa más que el estado. */
@Component({
  selector: 'app-estado-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      [class]="colores()"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ texto() }}
    </span>
  `,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoVehiculo>();
  readonly activo = input(true);

  protected readonly texto = computed(() =>
    this.activo() ? ETIQUETA_ESTADO[this.estado()] : 'Dado de baja',
  );
  protected readonly colores = computed(() =>
    this.activo() ? COLORES[this.estado()] : 'bg-subtle text-fg-muted',
  );
}
