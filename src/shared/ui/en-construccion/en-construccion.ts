import { Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

/** Página provisoria para las secciones del panel que todavía no están hechas. */
@Component({
  selector: 'app-en-construccion',
  imports: [Icono],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-h2">{{ titulo() }}</h1>
        <p class="text-sm text-fg-muted">Panel de gestión</p>
      </header>

      <section
        class="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-16 text-center"
      >
        <span class="grid size-12 place-items-center rounded-full bg-subtle text-fg-muted">
          <app-icono nombre="herramienta" class="size-6" />
        </span>
        <h2 class="text-h4">Esta sección todavía no está lista</h2>
        <p class="max-w-md text-sm text-fg-secondary">
          Estamos armando {{ titulo().toLowerCase() }}. Mientras tanto podés usar el resto del
          panel.
        </p>
      </section>
    </div>
  `,
})
export class EnConstruccion {
  /** Viene del data de la ruta. */
  readonly titulo = input('');
}
