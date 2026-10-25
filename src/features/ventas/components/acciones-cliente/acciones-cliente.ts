import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { Vehiculo } from '../../../vehiculos/model';
import { DIAS_RESERVA, SENA_MINIMA_PORCENTAJE, cotizacionReservable, senaMinima } from '../../logic';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { VentasService } from '../../services/ventas.service';

type Modo = 'cotizar' | 'reservar' | null;

/**
 * Botones del cliente logueado en el detalle de un vehículo:
 * pedir cotización (RF-18) y reservar con seña (RF-21), opcionalmente con el precio de una cotización.
 */
@Component({
  selector: 'app-acciones-cliente',
  imports: [RouterLink, Icono],
  host: { class: 'flex flex-col gap-3' },
  template: `
    @if (enviada()) {
      <div role="status" class="flex flex-col gap-2 rounded-md bg-success-bg px-4 py-3.5 text-sm text-success">
        <p class="font-medium">¡Listo, te vamos a cotizar!</p>
        <p>Un vendedor te responde y te avisamos por email.</p>
        <a routerLink="/cuenta/cotizaciones" class="font-medium underline">Ver mis cotizaciones</a>
      </div>
    } @else if (modo() === 'cotizar') {
      <form class="flex flex-col gap-3" novalidate (submit)="$event.preventDefault(); cotizar()">
        <label for="mensaje" class="etiqueta">¿Querés contarnos algo?</label>
        <textarea
          id="mensaje"
          rows="4"
          maxlength="1000"
          class="campo"
          placeholder="Ej.: ¿Cuánto me toman mi usado? ¿Hay descuento pagando de contado?"
          [value]="mensaje()"
          (input)="mensaje.set($any($event.target).value)"
        ></textarea>
        @if (error(); as e) {
          <p role="alert" class="error-campo">{{ e }}</p>
        }
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="boton boton-secundario" (click)="cerrar()">Cancelar</button>
          <button type="submit" class="boton boton-primario" [disabled]="enviando()">
            {{ enviando() ? 'Enviando…' : 'Pedir cotización' }}
          </button>
        </div>
      </form>
    } @else if (modo() === 'reservar') {
      <form class="flex flex-col gap-3" novalidate (submit)="$event.preventDefault(); reservar()">
        @if (cotizacion(); as c) {
          <p class="rounded-md bg-info-bg px-4 py-3 text-sm text-info">
            Con tu cotización: {{ precio(base()) }} (vale hasta el {{ fecha(c.fechaValidez!) }}).
          </p>
        } @else if (avisoCotizacion(); as aviso) {
          <p class="rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">{{ aviso }}</p>
        }
        <div class="flex flex-col gap-1.5">
          <label for="sena" class="etiqueta">Seña ($)</label>
          <input
            id="sena"
            type="number"
            inputmode="numeric"
            class="campo"
            [min]="minimo()"
            [class.campo-invalido]="intento() && !!errorSena()"
            [value]="sena()"
            (input)="sena.set(+$any($event.target).value)"
          />
          @if (intento() && errorSena(); as e) {
            <p class="error-campo">{{ e }}</p>
          } @else {
            <p class="text-xs text-fg-muted">
              Mínimo {{ precio(minimo()) }} ({{ porcentaje }} % del precio). Se descuenta del total.
            </p>
          }
        </div>
        <p class="text-sm text-fg-secondary">
          El auto queda apartado para vos {{ dias }} días. Para cerrar la compra, acercate al local con la seña.
        </p>
        @if (error(); as e) {
          <p role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">{{ e }}</p>
        }
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="boton boton-secundario" (click)="cerrar()">Cancelar</button>
          <button type="submit" class="boton boton-primario" [disabled]="enviando()">
            {{ enviando() ? 'Reservando…' : 'Confirmar reserva' }}
          </button>
        </div>
      </form>
    } @else {
      <button type="button" class="boton boton-primario" (click)="abrir('reservar')">
        Reservar vehículo
        <app-icono nombre="flecha-derecha" class="size-4" />
      </button>
      <button type="button" class="boton boton-secundario" (click)="abrir('cotizar')">
        <app-icono nombre="documento" class="size-4" />
        Solicitar cotización
      </button>
    }
  `,
})
export class AccionesCliente {
  private readonly cotizaciones = inject(CotizacionesService);
  private readonly ventas = inject(VentasService);
  private readonly router = inject(Router);

  readonly vehiculo = input.required<Vehiculo>();
  /** Id de una cotización del cliente para reservar con ese precio (?cotizacion= en la URL). */
  readonly cotizacionId = input<number | null>(null);

  protected readonly precio = formatearPrecio;
  protected readonly fecha = formatearFecha;
  protected readonly porcentaje = SENA_MINIMA_PORCENTAJE;
  protected readonly dias = DIAS_RESERVA;

  /** Con una cotización en la URL, el formulario de reserva arranca abierto. */
  protected readonly modo = linkedSignal<Modo>(() => (this.cotizacionId() ? 'reservar' : null));
  protected readonly mensaje = signal('');
  protected readonly enviando = signal(false);
  protected readonly enviada = signal(false);
  protected readonly intento = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly cotizacionRecurso = rxResource({
    params: () => this.cotizacionId() ?? undefined,
    stream: ({ params }) => (params ? this.cotizaciones.obtener(params) : of(null)),
  });
  /** La cotización solo se usa si es de este vehículo y sigue vigente. */
  protected readonly cotizacion = computed(() => {
    const c = valorDe(this.cotizacionRecurso);
    return c && c.vehiculoId === this.vehiculo().id && cotizacionReservable(c) ? c : null;
  });
  protected readonly avisoCotizacion = computed(() => {
    if (!this.cotizacionId() || this.cotizacionRecurso.isLoading()) return null;
    const e = this.cotizacionRecurso.error();
    if (e instanceof HttpErrorResponse && (e.status === 403 || e.status === 404)) {
      return 'No encontramos esa cotización: la reserva va con el precio de lista.';
    }
    return this.cotizacion() ? null : 'Esa cotización ya no está vigente: la reserva va con el precio de lista.';
  });

  protected readonly base = computed(
    () => this.cotizacion()?.precioFinal ?? this.vehiculo().precio,
  );
  protected readonly minimo = computed(() => senaMinima(this.base()));
  protected readonly sena = signal(0);
  protected readonly errorSena = computed(() => {
    const s = this.sena();
    if (!s || s < this.minimo()) return `La seña mínima es ${this.precio(this.minimo())}.`;
    if (s >= this.base()) return 'La seña tiene que ser menor que el precio.';
    return null;
  });

  constructor() {
    // La seña arranca en el mínimo (y se recalcula si llega la cotización).
    effect(() => {
      const minimo = this.minimo();
      untracked(() => this.sena.set(minimo));
    });
  }

  protected abrir(modo: Modo): void {
    this.error.set(null);
    this.intento.set(false);
    this.modo.set(modo);
  }

  protected cerrar(): void {
    this.modo.set(null);
    this.error.set(null);
  }

  protected cotizar(): void {
    this.enviando.set(true);
    this.error.set(null);
    this.cotizaciones.solicitar(this.vehiculo().id, this.mensaje().trim() || null).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviada.set(true);
        this.modo.set(null);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.enviando.set(false);
      },
    });
  }

  protected reservar(): void {
    this.intento.set(true);
    if (this.errorSena()) return;
    const v = this.vehiculo();
    this.enviando.set(true);
    this.error.set(null);
    this.ventas
      .reservarComoCliente({
        vehiculoId: v.id,
        montoAnticipo: this.sena(),
        cotizacionId: this.cotizacion()?.id ?? null,
      })
      .subscribe({
        next: (r) =>
          void this.router.navigate(['/cuenta/reservas'], {
            state: {
              aviso: `Reservaste el ${v.marca} ${v.modelo} hasta el ${formatearFecha(r.fechaVencimiento)}.`,
            },
          }),
        error: (err: unknown) => {
          this.error.set(mensajeDeError(err));
          this.enviando.set(false);
        },
      });
  }
}
