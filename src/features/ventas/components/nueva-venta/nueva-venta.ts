import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Buscador } from '../../../../shared/ui/buscador/buscador';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { formatearDocumento, nombreCompleto } from '../../../clientes/logic';
import { Cliente } from '../../../clientes/model';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { PlanesService } from '../../../financiamiento/services/planes.service';
import { ETIQUETA_ESTADO, aResumen } from '../../../vehiculos/logic';
import { VehiculoResumen } from '../../../vehiculos/model';
import { VehiculosService } from '../../../vehiculos/services/vehiculos.service';
import { cuentaVenta, descuentoMaximo } from '../../logic';
import { FormaPago, Tasacion } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { VentasService } from '../../services/ventas.service';
import { TasacionesCliente } from '../tasaciones-cliente/tasaciones-cliente';

/**
 * Registrar una venta (/panel/ventas/nueva), de contado o financiada (RF-23).
 * Acepta ?clienteId=&vehiculoId=&cotizacionId= para venir desde una cotización o una reserva.
 */
@Component({
  selector: 'app-nueva-venta',
  imports: [RouterLink, Icono, Buscador, TasacionesCliente],
  templateUrl: './nueva-venta.html',
})
export class NuevaVenta {
  private readonly servicio = inject(VentasService);
  private readonly cotizaciones = inject(CotizacionesService);
  private readonly clientes = inject(ClientesService);
  private readonly vehiculos = inject(VehiculosService);
  private readonly planes = inject(PlanesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly clienteId = input<string>();
  readonly vehiculoId = input<string>();
  readonly cotizacionId = input<string>();

  protected readonly formatearPrecio = formatearPrecio;

  protected readonly buscarClientes = (texto: string) =>
    this.clientes
      .buscar({ texto: texto || undefined, page: 0, size: 8 })
      .pipe(map((p) => p.content));
  protected readonly nombreCliente = (c: Cliente) => nombreCompleto(c);
  protected readonly detalleCliente = (c: Cliente) =>
    formatearDocumento(c.tipoDocumento, c.numeroDocumento) + (c.email ? ` · ${c.email}` : '');
  /** Disponibles y reservados (el reservado se puede vender a quien lo reservó). */
  protected readonly buscarVehiculos = (texto: string) =>
    this.vehiculos
      .buscar({ texto: texto || undefined, page: 0, size: 12, sort: 'fechaIngreso,desc' })
      .pipe(map((p) => p.content.filter((v) => v.estado !== 'VENDIDO')));
  protected readonly nombreVehiculo = (v: VehiculoResumen) => `${v.marca} ${v.modelo} ${v.anio}`;
  protected readonly detalleVehiculo = (v: VehiculoResumen) =>
    `${formatearPrecio(v.precio)} · ${v.color} · ${formatearKm(v.kilometraje)} · ${ETIQUETA_ESTADO[v.estado]}`;

  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly vehiculo = signal<VehiculoResumen | null>(null);
  protected readonly cotizacionElegida = signal<number | null>(null);
  protected readonly descuento = signal(0);
  protected readonly tasacion = signal<Tasacion | null>(null);
  protected readonly formaPago = signal<FormaPago>('CONTADO');
  protected readonly planId = signal<number | null>(null);
  protected readonly cuotas = signal<number | null>(null);
  protected readonly financiado = signal(0);
  /** Lo que se simula: espera a que termine de escribir el monto. */
  private readonly financiadoSimulado = signal(0);
  private temporizador?: ReturnType<typeof setTimeout>;

  private readonly par = computed(() => {
    const c = this.cliente();
    const v = this.vehiculo();
    return c && v ? { clienteId: c.id, vehiculoId: v.id } : undefined;
  });

  private readonly reservasRecurso = rxResource({
    params: () => this.par(),
    stream: ({ params }) =>
      this.servicio
        .buscarReservas({ ...params, estado: 'ACTIVA', page: 0, size: 1 })
        .pipe(map((p) => p.content[0] ?? null)),
  });
  /** Si el cliente tiene reservado el auto, el backend descuenta la seña solo. */
  protected readonly reserva = computed(() => valorDe(this.reservasRecurso) ?? null);
  protected readonly reservadoPorOtro = computed(
    () =>
      this.vehiculo()?.estado === 'RESERVADO' && this.reservasRecurso.hasValue() && !this.reserva(),
  );

  private readonly vigentesRecurso = rxResource({
    params: () => this.par(),
    stream: ({ params }) => this.cotizaciones.vigentesPara(params.clienteId, params.vehiculoId),
  });
  protected readonly cotizacionesVigentes = computed(() => valorDe(this.vigentesRecurso) ?? []);
  protected readonly cotizacion = computed(() =>
    this.cotizacionesVigentes().find((c) => c.id === this.cotizacionElegida()),
  );

  private readonly planesRecurso = rxResource({ stream: () => this.planes.listar() });
  protected readonly listaPlanes = computed(() => valorDe(this.planesRecurso) ?? []);
  protected readonly plan = computed(() => this.listaPlanes().find((p) => p.id === this.planId()));

  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  protected readonly precioLista = computed(
    () => this.cotizacion()?.precioLista ?? this.vehiculo()?.precio ?? 0,
  );
  protected readonly descuentoAplicado = computed(() =>
    this.cotizacion() ? (this.cotizacion()!.descuento ?? 0) : this.descuento(),
  );
  protected readonly valorTradeIn = computed(() =>
    this.cotizacion()
      ? (this.cotizacion()!.valorTradeIn ?? 0)
      : (this.tasacion()?.valorTasado ?? 0),
  );
  protected readonly cuenta = computed(() =>
    cuentaVenta({
      precioLista: this.precioLista(),
      descuento: this.descuentoAplicado(),
      valorTradeIn: this.valorTradeIn(),
      sena: this.reserva()?.montoAnticipo ?? 0,
      financiado: this.formaPago() === 'FINANCIADA' ? this.financiado() : 0,
      anticipoMinimoPlan: this.plan()?.porcentajeAnticipoMinimo ?? null,
    }),
  );
  protected readonly maximoDescuento = computed(() =>
    descuentoMaximo(this.precioLista(), this.esAdmin()),
  );

  private readonly simulacionRecurso = rxResource({
    params: () => {
      const plan = this.planId();
      const cuotas = this.cuotas();
      const financiado = this.financiadoSimulado();
      const precio = this.cuenta().precioFinal;
      if (this.formaPago() !== 'FINANCIADA' || !plan || !cuotas || financiado <= 0 || precio <= 0) {
        return undefined;
      }
      return { planId: plan, cantidadCuotas: cuotas, precio, anticipo: precio - financiado };
    },
    stream: ({ params }) => this.planes.simular(params),
  });
  protected readonly simulacion = computed(() => valorDe(this.simulacionRecurso));
  protected readonly errorSimulacion = computed(() => {
    const e = this.simulacionRecurso.error();
    return e ? mensajeDeError(e) : null;
  });

  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    const c = this.cliente();
    if (!c) e['cliente'] = 'Elegí el cliente.';
    else if (!c.numeroDocumento) e['cliente'] = 'El cliente no tiene documento cargado.';
    if (!this.vehiculo()) e['vehiculo'] = 'Elegí el vehículo.';
    else if (this.reservadoPorOtro()) e['vehiculo'] = 'Está reservado por otro cliente.';
    if (!this.cotizacion()) {
      const d = this.descuento();
      const max = this.maximoDescuento();
      if (d < 0) e['descuento'] = 'No puede ser negativo.';
      else if (max !== null && d > max)
        e['descuento'] = `Un vendedor puede descontar hasta ${formatearPrecio(max)}.`;
    }
    const cuenta = this.cuenta();
    if (this.vehiculo() && cuenta.saldo < 0)
      e['saldo'] = 'El auto usado y la seña superan el precio final.';
    if (this.formaPago() === 'FINANCIADA') {
      if (!this.planId()) e['plan'] = 'Elegí el plan.';
      if (!this.cuotas()) e['cuotas'] = 'Elegí la cantidad de cuotas.';
      const f = this.financiado();
      if (f <= 0) e['financiado'] = 'Ingresá cuánto se financia.';
      else if (f > cuenta.maximoFinanciable)
        e['financiado'] = `Se puede financiar hasta ${formatearPrecio(cuenta.maximoFinanciable)}.`;
    }
    return e;
  });

  constructor() {
    // Precarga desde una cotización o una reserva.
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
    // Si hay una sola cotización vigente, se usa sola.
    effect(() => {
      const lista = this.cotizacionesVigentes();
      if (!this.vigentesRecurso.hasValue()) return;
      const elegida = untracked(() => this.cotizacionElegida());
      if (elegida && !lista.some((c) => c.id === elegida)) this.cotizacionElegida.set(null);
      else if (!elegida && lista.length === 1) this.cotizacionElegida.set(lista[0].id);
    });
  }

  protected elegirCliente(c: Cliente | null): void {
    this.cliente.set(c);
    this.tasacion.set(null);
    this.cotizacionElegida.set(null);
  }

  protected elegirVehiculo(v: VehiculoResumen | null): void {
    this.vehiculo.set(v);
    this.cotizacionElegida.set(null);
  }

  protected elegirPlan(valor: string): void {
    this.planId.set(valor ? Number(valor) : null);
    // Si el plazo elegido no está en el plan nuevo, se borra.
    if (!this.plan()?.plazos.includes(this.cuotas() ?? -1)) this.cuotas.set(null);
  }

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }

  protected cambiarFinanciado(valor: number): void {
    this.financiado.set(valor);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.financiadoSimulado.set(valor), 400);
  }

  /** Financiar lo máximo que permite el plan. */
  protected financiarMaximo(): void {
    this.cambiarFinanciado(this.cuenta().maximoFinanciable);
  }

  protected registrar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    const financiada = this.formaPago() === 'FINANCIADA';
    const conCotizacion = !!this.cotizacion();
    this.guardando.set(true);
    this.error.set(null);
    this.servicio
      .vender({
        clienteId: this.cliente()!.id,
        vehiculoId: this.vehiculo()!.id,
        cotizacionId: this.cotizacion()?.id ?? null,
        // Con cotización, el descuento y el auto usado salen de ella.
        descuento: conCotizacion ? null : this.descuento(),
        tasacionId: conCotizacion ? null : (this.tasacion()?.id ?? null),
        formaPago: this.formaPago(),
        planFinanciamientoId: financiada ? this.planId() : null,
        cantidadCuotas: financiada ? this.cuotas() : null,
        montoFinanciado: financiada ? this.financiado() : null,
      })
      .subscribe({
        next: (venta) =>
          void this.router.navigate(['/panel/ventas', venta.id], {
            state: { aviso: `Venta ${venta.numeroComprobante} registrada.` },
          }),
        error: (err: unknown) => {
          this.error.set(mensajeDeError(err));
          this.guardando.set(false);
        },
      });
  }
}
