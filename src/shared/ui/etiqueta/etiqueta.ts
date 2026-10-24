import { Component, computed, input } from '@angular/core';

export type Tono = 'exito' | 'aviso' | 'peligro' | 'info' | 'neutro';

const COLORES: Record<Tono, string> = {
  exito: 'bg-success-bg text-success',
  aviso: 'bg-warning-bg text-warning',
  peligro: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutro: 'bg-subtle text-fg-muted',
};

/** Etiqueta redondeada de color para estados ("Activa", "En mora", etc.). */
@Component({
  selector: 'app-etiqueta',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      [class]="colores()"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      <ng-content />
    </span>
  `,
})
export class Etiqueta {
  readonly tono = input<Tono>('neutro');
  protected readonly colores = computed(() => COLORES[this.tono()]);
}
