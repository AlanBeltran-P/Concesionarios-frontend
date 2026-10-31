import { Component, input } from '@angular/core';

/** Aviso chico con un círculo girando, para cuando se recargan datos que ya están en pantalla. */
@Component({
  selector: 'app-actualizando',
  host: { class: 'inline-flex items-center gap-2 text-sm text-fg-muted', role: 'status' },
  template: `
    <span
      class="size-4 animate-spin rounded-full border-2 border-line-strong border-t-fg"
      aria-hidden="true"
    ></span>
    {{ texto() }}
  `,
})
export class Actualizando {
  readonly texto = input('Actualizando…');
}
