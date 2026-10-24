import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../shared/ui/icono/icono';
import { CatalogoModelos } from '../catalogo-modelos/catalogo-modelos';
import { CatalogoSimple } from '../catalogo-simple/catalogo-simple';

type Seccion = 'marcas' | 'modelos' | 'categorias';

const PESTANIAS: { seccion: Seccion; texto: string }[] = [
  { seccion: 'marcas', texto: 'Marcas' },
  { seccion: 'modelos', texto: 'Modelos' },
  { seccion: 'categorias', texto: 'Categorías' },
];

/** Administración de marcas, modelos y categorías (/panel/vehiculos/catalogo). Solo ADMIN. */
@Component({
  selector: 'app-catalogo-vehiculos',
  imports: [RouterLink, Icono, CatalogoSimple, CatalogoModelos],
  template: `
    <div class="flex flex-col gap-6">
      <a
        routerLink="/panel/vehiculos"
        class="inline-flex w-fit items-center gap-1 text-sm font-medium text-fg-secondary hover:text-fg"
      >
        <app-icono nombre="flecha-izquierda" class="size-4" />
        Vehículos
      </a>

      <header class="flex flex-col gap-1">
        <h1 class="text-h2">Marcas, modelos y categorías</h1>
        <p class="text-sm text-fg-muted">
          Lo que se puede elegir al cargar un vehículo. Desactivar algo no cambia los vehículos que
          ya lo usan.
        </p>
      </header>

      <nav class="flex w-fit gap-1 rounded-md bg-subtle p-1" aria-label="Secciones">
        @for (p of pestanias; track p.seccion) {
          <a
            routerLink="."
            [queryParams]="{ seccion: p.seccion }"
            class="rounded-[7px] px-4 py-2 text-sm font-medium transition"
            [class.bg-surface]="actual() === p.seccion"
            [class.shadow-sm]="actual() === p.seccion"
            [class.text-fg]="actual() === p.seccion"
            [class.text-fg-secondary]="actual() !== p.seccion"
            [attr.aria-current]="actual() === p.seccion ? 'page' : null"
          >
            {{ p.texto }}
          </a>
        }
      </nav>

      @switch (actual()) {
        @case ('modelos') {
          <app-catalogo-modelos />
        }
        @case ('categorias') {
          <app-catalogo-simple tipo="categorias" />
        }
        @default {
          <app-catalogo-simple tipo="marcas" />
        }
      }
    </div>
  `,
})
export class CatalogoVehiculos {
  /** ?seccion= de la URL. */
  readonly seccion = input<string>();

  protected readonly pestanias = PESTANIAS;
  protected readonly actual = computed<Seccion>(() =>
    PESTANIAS.some((p) => p.seccion === this.seccion()) ? (this.seccion() as Seccion) : 'marcas',
  );
}
