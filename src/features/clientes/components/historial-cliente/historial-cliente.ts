import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_FINANCIAMIENTO, MEDIO_PAGO, TIPO_PAGO } from '../../../financiamiento/logic';
import { ESTADO_COTIZACION, ESTADO_RESERVA, ESTADO_VENTA, FORMA_PAGO } from '../../../ventas/logic';
import { ClientesService } from '../../services/clientes.service';
import { EsqueletoLineas } from '../../../../shared/ui/carga/esqueleto-lineas';

type Seccion = 'compras' | 'financiamientos' | 'reservas' | 'cotizaciones' | 'pagos';

const SECCIONES: { seccion: Seccion; texto: string; vacio: string }[] = [
  { seccion: 'compras', texto: 'Compras', vacio: 'Todavía no compró ningún vehículo.' },
  { seccion: 'financiamientos', texto: 'Financiamientos', vacio: 'No tiene financiamientos.' },
  { seccion: 'reservas', texto: 'Reservas', vacio: 'No hizo reservas.' },
  { seccion: 'cotizaciones', texto: 'Cotizaciones', vacio: 'No pidió cotizaciones.' },
  { seccion: 'pagos', texto: 'Pagos', vacio: 'No registró pagos.' },
];

/** Historial del cliente (RF-17): todo lo que hizo con la concesionaria. */
@Component({
  selector: 'app-historial-cliente',
  imports: [EsqueletoLineas, Etiqueta],
  templateUrl: './historial-cliente.html',
})
export class HistorialClienteComponent {
  private readonly servicio = inject(ClientesService);

  readonly clienteId = input.required<number>();

  protected readonly secciones = SECCIONES;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly estadoVenta = ESTADO_VENTA;
  protected readonly estadoReserva = ESTADO_RESERVA;
  protected readonly estadoCotizacion = ESTADO_COTIZACION;
  protected readonly estadoFinanciamiento = ESTADO_FINANCIAMIENTO;
  protected readonly formaPago = FORMA_PAGO;
  protected readonly tipoPago = TIPO_PAGO;
  protected readonly medioPago = MEDIO_PAGO;

  private readonly recurso = rxResource({
    params: () => this.clienteId(),
    stream: ({ params }) => this.servicio.historial(params),
  });
  protected readonly historial = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  private readonly elegida = signal<Seccion | null>(null);
  /** Si no eligió ninguna, muestra la primera que tenga algo. */
  protected readonly actual = computed<Seccion>(() => {
    const h = this.historial();
    return this.elegida() ?? SECCIONES.find((s) => h && h[s.seccion].length)?.seccion ?? 'compras';
  });
  protected readonly vacio = computed(
    () => SECCIONES.find((s) => s.seccion === this.actual())!.vacio,
  );

  protected cantidad(seccion: Seccion): number {
    return this.historial()?.[seccion].length ?? 0;
  }

  protected elegir(seccion: Seccion): void {
    this.elegida.set(seccion);
  }

  protected reintentar(): void {
    this.recurso.reload();
  }
}
