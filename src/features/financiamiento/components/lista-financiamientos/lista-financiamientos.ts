import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_FINANCIAMIENTO } from '../../logic';
import { EstadoFinanciamiento } from '../../model';
import { FinanciamientosService } from '../../services/financiamientos.service';
import { EsqueletoFilas } from '../../../../shared/ui/carga/esqueleto-filas';

/** Financiamientos de todos los clientes, filtrables por estado. */
@Component({
  selector: 'app-lista-financiamientos',
  imports: [EsqueletoFilas, RouterLink, Etiqueta, Paginado],
  template: `
    <div class="flex flex-col gap-4">
      <label class="w-full sm:w-56">
        <span class="sr-only">Estado</span>
        <select class="campo" (change)="filtrar($any($event.target).value)">
          <option value="" [selected]="!estado()">Todos los estados</option>
          @for (e of estados; track e[0]) {
            <option [value]="e[0]" [selected]="estado() === e[0]">{{ e[1].texto }}</option>
          }
        </select>
      </label>

      @if (error(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {{ mensaje }}
        </p>
      } @else {
        <section
          class="tarjeta overflow-hidden"
          aria-label="Financiamientos"
          [attr.aria-busy]="cargando()"
        >
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-line bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
            >
              <tr>
                <th scope="col" class="px-4 py-3 sm:px-5">Cliente</th>
                <th scope="col" class="hidden px-5 py-3 md:table-cell">Plan</th>
                <th scope="col" class="hidden px-5 py-3 lg:table-cell">Desde</th>
                <th scope="col" class="px-4 py-3 text-right sm:px-5">Cuota</th>
                <th scope="col" class="hidden px-5 py-3 sm:table-cell">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line" [class.opacity-60]="cargando()">
              @for (f of datos()?.content ?? []; track f.id) {
                <tr class="relative transition hover:bg-subtle">
                  <td class="px-4 py-3.5 sm:px-5">
                    <div class="flex min-w-0 flex-col">
                      <a
                        [routerLink]="[f.id]"
                        class="truncate font-medium after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {{ f.clienteNombre }}
                      </a>
                      <span class="truncate text-xs text-fg-muted">
                        {{ f.numeroComprobante }} · Financiado
                        {{ formatearPrecio(f.montoFinanciado) }}
                      </span>
                    </div>
                  </td>
                  <td class="hidden px-5 py-3.5 text-fg-secondary md:table-cell">
                    {{ f.plan }} ({{ f.tasaAnualAplicada }} %)
                  </td>
                  <td class="hidden px-5 py-3.5 whitespace-nowrap text-fg-secondary lg:table-cell">
                    {{ formatearFecha(f.fechaCreacion) }}
                  </td>
                  <td class="px-4 py-3.5 text-right whitespace-nowrap sm:px-5">
                    <span class="font-display font-semibold">
                      {{ f.cantidadCuotas }} × {{ formatearPrecio(f.valorCuota) }}
                    </span>
                    <app-etiqueta
                      class="mt-1 block font-sans sm:hidden"
                      [tono]="estadoFinanciamiento[f.estado].tono"
                    >
                      {{ estadoFinanciamiento[f.estado].texto }}
                    </app-etiqueta>
                  </td>
                  <td class="hidden px-5 py-3.5 sm:table-cell">
                    <app-etiqueta [tono]="estadoFinanciamiento[f.estado].tono">
                      {{ estadoFinanciamiento[f.estado].texto }}
                    </app-etiqueta>
                  </td>
                </tr>
              } @empty {
                @if (cargando()) {
                  <app-esqueleto-filas [columnas]="5" />
                } @else {
                  <tr>
                    <td colspan="5" class="px-5 py-14 text-center text-fg-muted">
                      {{ 'No hay financiamientos con ese filtro.' }}
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
          <app-paginado [info]="datos()?.page" (cambiar)="pagina.set($event)" />
        </section>
      }
    </div>
  `,
})
export class ListaFinanciamientos {
  private readonly servicio = inject(FinanciamientosService);

  protected readonly estadoFinanciamiento = ESTADO_FINANCIAMIENTO;
  protected readonly estados = Object.entries(ESTADO_FINANCIAMIENTO) as [
    EstadoFinanciamiento,
    { texto: string },
  ][];
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;

  protected readonly estado = signal<EstadoFinanciamiento | undefined>(undefined);
  protected readonly pagina = signal(0);

  private readonly recurso = rxResource({
    params: () => ({ estado: this.estado(), page: this.pagina(), size: 20 }),
    stream: ({ params }) => this.servicio.buscar(params),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  protected filtrar(valor: string): void {
    this.estado.set((valor || undefined) as EstadoFinanciamiento | undefined);
    this.pagina.set(0);
  }
}
