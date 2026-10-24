import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Buscador } from '../../../../shared/ui/buscador/buscador';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { formatearDocumento, nombreCompleto } from '../../../clientes/logic';
import { Cliente } from '../../../clientes/model';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { aResumen } from '../../../vehiculos/logic';
import { VehiculoResumen } from '../../../vehiculos/model';
import { VehiculosService } from '../../../vehiculos/services/vehiculos.service';
import {
  DIAS_RESERVA,
  DIAS_RESERVA_MAXIMO,
  ESTADO_RESERVA,
  SENA_MINIMA_PORCENTAJE,
  senaMinima,
} from '../../logic';
import { Cotizacion, Reserva } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { VentasService } from '../../services/ventas.service';

/**
 * Alta de una reserva con seña (/panel/ventas/reservas/nueva) y su ficha (/panel/ventas/reservas/:id).
 * El alta acepta ?clienteId=&vehiculoId=&cotizacionId= para venir desde una cotización.
 */
@Component({
  selector: 'app-ficha-reserva',
  imports: [RouterLink, Icono, Etiqueta, Buscador],
  templateUrl: './ficha-reserva.html',
})
export class FichaReserva {
  private readonly servicio = inject(VentasService);
  private readonly cotizaciones = inject(CotizacionesService);
  private readonly clientes = inject(ClientesService);
  private readonly vehiculos = inject(VehiculosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  readonly clienteId = input<string>();
  readonly vehiculoId = input<string>();
  readonly cotizacionId = input<string>();

  protected readonly estadoReserva = ESTADO_RESERVA;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly porcentajeSena = SENA_MINIMA_PORCENTAJE;
  protected readonly diasMaximo = DIAS_RESERVA_MAXIMO;

  protected readonly buscarClientes = (texto: string) =>
    this.clientes
      .buscar({ texto: texto || undefined, page: 0, size: 8 })
      .pipe(map((p) => p.content));
  protected readonly nombreCliente = (c: Cliente) => nombreCompleto(c);
  protected readonly detalleCliente = (c: Cliente) =>
    formatearDocumento(c.tipoDocumento, c.numeroDocumento) + (c.email ? ` · ${c.email}` : '');
  protected readonly buscarVehiculos = (texto: string) =>
    this.vehiculos
      .buscar({
        texto: texto || undefined,
        estado: 'DISPONIBLE',
        page: 0,
        size: 8,
        sort: 'fechaIngreso,desc',
      })
      .pipe(map((p) => p.content));
  protected readonly nombreVehiculo = (v: VehiculoResumen) => `${v.marca} ${v.modelo} ${v.anio}`;
  protected readonly detalleVehiculo = (v: VehiculoResumen) =>
    `${formatearPrecio(v.precio)} · ${v.color} · ${formatearKm(v.kilometraje)}`;

  private readonly recurso = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.servicio.obtenerReserva(params),
  });
  protected readonly reserva = computed(() => valorDe(this.recurso));
  protected readonly esNueva = computed(() => !this.id());
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos esa reserva.'
      : mensajeDeError(e);
  });

  // Alta
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly vehiculo = signal<VehiculoResumen | null>(null);
  protected readonly cotizacionElegida = signal<number | null>(null);
  protected readonly sena = signal(0);
  protected readonly dias = signal(DIAS_RESERVA);

  private readonly vigentes = rxResource({
    params: () => {
      const c = this.cliente();
      const v = this.vehiculo();
      return c && v ? { clienteId: c.id, vehiculoId: v.id } : undefined;
    },
    stream: ({ params }) => this.cotizaciones.vigentesPara(params.clienteId, params.vehiculoId),
  });
  protected readonly cotizacionesVigentes = computed(() => valorDe(this.vigentes) ?? []);
  private readonly cotizacion = computed<Cotizacion | undefined>(() =>
    this.cotizacionesVigentes().find((c) => c.id === this.cotizacionElegida()),
  );
  /** La seña mínima se calcula sobre el precio cotizado, o el de lista si no hay cotización. */
  protected readonly precioBase = computed(
    () => this.cotizacion()?.precioFinal ?? this.vehiculo()?.precio ?? 0,
  );
  protected readonly minimo = computed(() => senaMinima(this.precioBase()));

  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );

  // Anulación (ADMIN)
  protected readonly anulando = signal(false);
  protected readonly motivo = signal('');

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    if (!this.cliente()) e['cliente'] = 'Elegí el cliente.';
    if (!this.vehiculo()) e['vehiculo'] = 'Elegí el vehículo.';
    const sena = this.sena();
    if (this.vehiculo()) {
      if (sena < this.minimo())
        e['sena'] =
          `La seña mínima es ${formatearPrecio(this.minimo())} (${SENA_MINIMA_PORCENTAJE} % del precio).`;
      else if (sena >= this.precioBase())
        e['sena'] = 'La seña no puede cubrir todo el precio: registrá directamente la venta.';
    } else if (sena <= 0) {
      e['sena'] = 'Ingresá la seña.';
    }
    const d = this.dias();
    if (!Number.isInteger(d) || d < 1 || d > DIAS_RESERVA_MAXIMO)
      e['dias'] = `Entre 1 y ${DIAS_RESERVA_MAXIMO} días.`;
    return e;
  });

  constructor() {
    // Precarga desde una cotización (?clienteId=&vehiculoId=&cotizacionId=).
    effect(() => {
      const clienteId = Number(this.clienteId());
      const vehiculoId = Number(this.vehiculoId());
      const cotizacionId = Number(this.cotizacionId());
      untracked(() => {
        if (clienteId) this.clientes.obtener(clienteId).subscribe((c) => this.cliente.set(c));
        if (vehiculoId) {
          this.vehiculos.obtener(vehiculoId).subscribe((v) => this.vehiculo.set(aResumen(v)));
        }
        if (cotizacionId) this.cotizacionElegida.set(cotizacionId);
      });
    });
    // Si la cotización elegida no es de este cliente y vehículo, se quita.
    effect(() => {
      const lista = this.cotizacionesVigentes();
      const elegida = untracked(() => this.cotizacionElegida());
      if (this.vigentes.hasValue() && elegida && !lista.some((c) => c.id === elegida)) {
        this.cotizacionElegida.set(null);
      }
    });
  }

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }

  protected reservar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    this.guardando.set(true);
    this.error.set(null);
    this.servicio
      .reservar({
        clienteId: this.cliente()!.id,
        vehiculoId: this.vehiculo()!.id,
        montoAnticipo: this.sena(),
        cotizacionId: this.cotizacionElegida(),
        diasVigencia: this.dias(),
      })
      .subscribe({
        next: (r) =>
          void this.router.navigate(['/panel/ventas/reservas', r.id], {
            state: { aviso: 'Vehículo reservado.' },
          }),
        error: (err: unknown) => {
          this.error.set(mensajeDeError(err));
          this.guardando.set(false);
        },
      });
  }

  protected anular(): void {
    const r = this.reserva();
    if (!r || !this.motivo().trim()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.servicio.anularReserva(r.id, this.motivo().trim()).subscribe({
      next: (actualizada: Reserva) => {
        this.recurso.set(actualizada);
        this.aviso.set('Reserva anulada. El vehículo volvió a estar disponible.');
        this.anulando.set(false);
        this.guardando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.guardando.set(false);
      },
    });
  }
}
