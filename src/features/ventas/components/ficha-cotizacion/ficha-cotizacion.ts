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
import { VehiculoResumen } from '../../../vehiculos/model';
import { VehiculosService } from '../../../vehiculos/services/vehiculos.service';
import {
  DESCUENTO_MAXIMO_VENDEDOR,
  DIAS_VALIDEZ_COTIZACION,
  ESTADO_COTIZACION,
  descuentoMaximo,
  precioFinal,
} from '../../logic';
import { Cotizacion, RespuestaCotizacion, Tasacion } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { TasacionesCliente } from '../tasaciones-cliente/tasaciones-cliente';

/** Alta (/panel/cotizaciones/nueva) y ficha de una cotización (/panel/cotizaciones/:id). */
@Component({
  selector: 'app-ficha-cotizacion',
  imports: [RouterLink, Icono, Etiqueta, Buscador, TasacionesCliente],
  templateUrl: './ficha-cotizacion.html',
})
export class FichaCotizacion {
  private readonly servicio = inject(CotizacionesService);
  private readonly clientes = inject(ClientesService);
  private readonly vehiculos = inject(VehiculosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly estadoCotizacion = ESTADO_COTIZACION;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly topeVendedor = DESCUENTO_MAXIMO_VENDEDOR;

  // Buscadores del alta
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
    stream: ({ params }) => this.servicio.obtener(params),
  });
  protected readonly cotizacion = computed(() => valorDe(this.recurso));
  protected readonly esNueva = computed(() => !this.id());
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos esa cotización.'
      : mensajeDeError(e);
  });

  // Datos que se cargan
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly vehiculo = signal<VehiculoResumen | null>(null);
  protected readonly descuento = signal(0);
  protected readonly tasacion = signal<Tasacion | null>(null);
  protected readonly respuesta = signal('');
  protected readonly diasValidez = signal(DIAS_VALIDEZ_COTIZACION);

  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  protected readonly clienteId = computed(
    () => this.cotizacion()?.clienteId ?? this.cliente()?.id ?? null,
  );
  protected readonly precioLista = computed(
    () => this.cotizacion()?.precioLista ?? this.vehiculo()?.precio ?? 0,
  );
  protected readonly maximo = computed(() => descuentoMaximo(this.precioLista(), this.esAdmin()));
  protected readonly total = computed(() =>
    precioFinal(this.precioLista(), this.descuento(), this.tasacion()?.valorTasado ?? 0),
  );

  /** Se puede responder si sigue abierta y es suya, nadie la tomó o es ADMIN. */
  protected readonly puedeResponder = computed(() => {
    const c = this.cotizacion();
    if (!c) return this.esNueva();
    const abierta = c.estado === 'SOLICITADA' || c.estado === 'RESPONDIDA';
    const suya = !c.vendedorId || c.vendedorId === this.auth.usuario()?.id || this.esAdmin();
    return abierta && suya;
  });
  protected readonly atendidaPorOtro = computed(() => {
    const c = this.cotizacion();
    return (
      !!c && (c.estado === 'SOLICITADA' || c.estado === 'RESPONDIDA') && !this.puedeResponder()
    );
  });

  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    if (this.esNueva() && !this.cliente()) e['cliente'] = 'Elegí el cliente.';
    if (this.esNueva() && !this.vehiculo()) e['vehiculo'] = 'Elegí el vehículo.';
    const d = this.descuento();
    const max = this.maximo();
    if (d < 0) e['descuento'] = 'No puede ser negativo.';
    else if (max !== null && d > max)
      e['descuento'] =
        `Un vendedor puede descontar hasta ${formatearPrecio(max)}. Para más, lo autoriza un ADMIN.`;
    else if (this.precioLista() && d >= this.precioLista())
      e['descuento'] = 'Tiene que ser menor al precio.';
    if (this.total() < 0) e['tasacion'] = 'El auto usado vale más que el precio con descuento.';
    if (!this.respuesta().trim()) e['respuesta'] = 'Escribí la respuesta para el cliente.';
    const dias = this.diasValidez();
    if (!Number.isInteger(dias) || dias < 1 || dias > 60) e['dias'] = 'Entre 1 y 60 días.';
    return e;
  });

  constructor() {
    // Al abrir una cotización, carga su respuesta para poder corregirla.
    effect(() => {
      const c = this.cotizacion();
      if (!c) return;
      untracked(() => {
        this.descuento.set(c.descuento ?? 0);
        this.respuesta.set(c.respuestaVendedor ?? '');
      });
    });
  }

  /** En el alta, el auto usado elegido era del cliente anterior. */
  protected elegirCliente(c: Cliente | null): void {
    this.cliente.set(c);
    this.tasacion.set(null);
  }

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }

  protected guardar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    const datos: RespuestaCotizacion = {
      descuento: this.descuento(),
      tasacionId: this.tasacion()?.id ?? null,
      respuesta: this.respuesta().trim(),
      diasValidez: this.diasValidez(),
    };
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    const c = this.cotizacion();
    if (!c) {
      this.servicio
        .crear({ ...datos, clienteId: this.cliente()!.id, vehiculoId: this.vehiculo()!.id })
        .subscribe({
          next: (creada) =>
            void this.router.navigate(['/panel/cotizaciones', creada.id], {
              state: { aviso: 'Cotización enviada al cliente.' },
            }),
          error: (err: unknown) => this.fallo(err),
        });
    } else {
      this.servicio.responder(c.id, datos).subscribe({
        next: (actualizada) =>
          this.terminar(
            actualizada,
            c.estado === 'SOLICITADA' ? 'Respuesta enviada al cliente.' : 'Respuesta corregida.',
          ),
        error: (err: unknown) => this.fallo(err),
      });
    }
  }

  protected decidir(decision: 'aceptar' | 'rechazar'): void {
    const c = this.cotizacion();
    if (!c) return;
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    this.servicio.decidir(c.id, decision).subscribe({
      next: (actualizada) =>
        this.terminar(
          actualizada,
          decision === 'aceptar' ? 'El cliente aceptó la cotización.' : 'Cotización rechazada.',
        ),
      error: (err: unknown) => this.fallo(err),
    });
  }

  private terminar(c: Cotizacion, aviso: string): void {
    this.recurso.set(c);
    this.aviso.set(aviso);
    this.intento.set(false);
    this.guardando.set(false);
  }

  private fallo(err: unknown): void {
    this.error.set(mensajeDeError(err));
    this.guardando.set(false);
    if (err instanceof HttpErrorResponse && err.status === 409) this.recurso.reload();
  }
}
