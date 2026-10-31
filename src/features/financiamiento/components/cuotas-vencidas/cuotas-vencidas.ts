import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { FinanciamientosService } from '../../services/financiamientos.service';
import { EsqueletoFilas } from '../../../../shared/ui/carga/esqueleto-filas';

/** Cuotas vencidas sin pagar (mora, RF-33). El ADMIN puede correr el proceso de vencimientos. */
@Component({
  selector: 'app-cuotas-vencidas',
  imports: [EsqueletoFilas, RouterLink, Paginado],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-fg-muted">
          Cuotas que pasaron su vencimiento sin pagarse. La mora se suma todos los días.
        </p>
        @if (esAdmin()) {
          <button
            type="button"
            class="boton boton-secundario"
            [disabled]="procesando()"
            (click)="procesar()"
          >
            {{ procesando() ? 'Procesando…' : 'Actualizar vencimientos ahora' }}
          </button>
        }
      </div>
      @if (aviso(); as mensaje) {
        <p role="status" class="rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          {{ mensaje }}
        </p>
      }
      @if (error(); as mensaje) {
        <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
          {{ mensaje }}
        </p>
      }

      <section
        class="tarjeta overflow-hidden"
        aria-label="Cuotas vencidas"
        [attr.aria-busy]="cargando()"
      >
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-line bg-subtle text-xs font-semibold tracking-[0.04em] text-fg-muted uppercase"
          >
            <tr>
              <th scope="col" class="px-4 py-3 sm:px-5">Cliente</th>
              <th scope="col" class="hidden px-5 py-3 md:table-cell">Venció</th>
              <th scope="col" class="hidden px-5 py-3 md:table-cell">Atraso</th>
              <th scope="col" class="hidden px-5 py-3 text-right lg:table-cell">Mora</th>
              <th scope="col" class="px-4 py-3 text-right sm:px-5">Debe</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line" [class.opacity-60]="cargando()">
            @for (c of datos()?.content ?? []; track c.id) {
              <tr class="relative transition hover:bg-subtle">
                <td class="px-4 py-3.5 sm:px-5">
                  <div class="flex min-w-0 flex-col">
                    <a
                      [routerLink]="[c.financiamientoId]"
                      class="truncate font-medium after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {{ c.clienteNombre }}
                    </a>
                    <span class="text-xs text-fg-muted">
                      Cuota {{ c.numero }}
                      <span class="md:hidden">· {{ c.diasAtraso }} días de atraso</span>
                    </span>
                  </div>
                </td>
                <td class="hidden px-5 py-3.5 whitespace-nowrap text-fg-secondary md:table-cell">
                  {{ formatearFecha(c.fechaVencimiento) }}
                </td>
                <td class="hidden px-5 py-3.5 font-medium text-danger md:table-cell">
                  {{ c.diasAtraso }} días
                </td>
                <td class="hidden px-5 py-3.5 text-right text-fg-secondary lg:table-cell">
                  {{ formatearPrecio(c.mora) }}
                </td>
                <td
                  class="px-4 py-3.5 text-right font-display font-semibold whitespace-nowrap sm:px-5"
                >
                  {{ formatearPrecio(c.saldo) }}
                </td>
              </tr>
            } @empty {
              @if (cargando()) {
                <app-esqueleto-filas [columnas]="5" />
              } @else {
                <tr>
                  <td colspan="5" class="px-5 py-14 text-center text-fg-muted">
                    {{ 'No hay cuotas vencidas. Todos al día.' }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
        <app-paginado [info]="datos()?.page" (cambiar)="pagina.set($event)" />
      </section>
    </div>
  `,
})
export class CuotasVencidas {
  private readonly servicio = inject(FinanciamientosService);
  private readonly auth = inject(AuthService);

  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  protected readonly pagina = signal(0);

  private readonly recurso = rxResource({
    params: () => ({ estado: 'VENCIDA' as const, page: this.pagina(), size: 20 }),
    stream: ({ params }) => this.servicio.cuotas(params),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  private readonly errorAccion = signal<string | null>(null);
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : this.errorAccion();
  });
  protected readonly aviso = signal<string | null>(null);
  protected readonly procesando = signal(false);

  protected procesar(): void {
    this.procesando.set(true);
    this.aviso.set(null);
    this.errorAccion.set(null);
    this.servicio.procesarVencimientos().subscribe({
      next: (r) => {
        this.aviso.set(
          `Listo: ${r.cuotasVencidas} cuotas pasaron a vencidas y se actualizó la mora de ${r.morasActualizadas}.`,
        );
        this.recurso.reload();
        this.procesando.set(false);
      },
      error: (err: unknown) => {
        this.errorAccion.set(mensajeDeError(err));
        this.procesando.set(false);
      },
    });
  }
}
