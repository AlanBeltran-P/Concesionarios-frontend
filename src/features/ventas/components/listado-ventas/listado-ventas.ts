import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { ESTADO_RESERVA, ESTADO_VENTA, FORMA_PAGO } from '../../logic';
import { EstadoReserva, EstadoVenta } from '../../model';
import { VentasService } from '../../services/ventas.service';
import { EsqueletoFilas } from '../../../../shared/ui/carga/esqueleto-filas';

type Vista = 'ventas' | 'reservas';
const POR_PAGINA = 20;

/** Ventas y reservas (/panel/ventas?vista=reservas). */
@Component({
  selector: 'app-listado-ventas',
  imports: [EsqueletoFilas, RouterLink, Icono, Etiqueta, Paginado],
  templateUrl: './listado-ventas.html',
})
export class ListadoVentas {
  private readonly servicio = inject(VentasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly vista = input<string>();

  protected readonly estadoVenta = ESTADO_VENTA;
  protected readonly estadoReserva = ESTADO_RESERVA;
  protected readonly formaPago = FORMA_PAGO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly estadosVenta = Object.entries(ESTADO_VENTA) as [
    EstadoVenta,
    { texto: string },
  ][];
  protected readonly estadosReserva = Object.entries(ESTADO_RESERVA) as [
    EstadoReserva,
    { texto: string },
  ][];

  protected readonly actual = computed<Vista>(() =>
    this.vista() === 'reservas' ? 'reservas' : 'ventas',
  );

  // Filtros de ventas
  protected readonly estadoVentaFiltro = signal<EstadoVenta | undefined>(undefined);
  protected readonly soloMias = signal(false);
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  // Filtro de reservas: por defecto las activas, que son las que hay que seguir.
  protected readonly estadoReservaFiltro = signal<EstadoReserva | undefined>('ACTIVA');
  protected readonly pagina = signal(0);

  private readonly ventas = rxResource({
    params: () =>
      this.actual() === 'ventas'
        ? {
            estado: this.estadoVentaFiltro(),
            vendedorId: this.soloMias() ? this.auth.usuario()?.id : undefined,
            desde: this.desde() || undefined,
            hasta: this.hasta() || undefined,
            page: this.pagina(),
            size: POR_PAGINA,
          }
        : undefined,
    stream: ({ params }) => this.servicio.buscarVentas(params),
  });
  private readonly reservas = rxResource({
    params: () =>
      this.actual() === 'reservas'
        ? { estado: this.estadoReservaFiltro(), page: this.pagina(), size: POR_PAGINA }
        : undefined,
    stream: ({ params }) => this.servicio.buscarReservas(params),
  });
  protected readonly datosVentas = computed(() => valorDe(this.ventas));
  protected readonly datosReservas = computed(() => valorDe(this.reservas));
  protected readonly cargando = computed(
    () => this.ventas.isLoading() || this.reservas.isLoading(),
  );
  protected readonly error = computed(() => {
    const e = this.actual() === 'ventas' ? this.ventas.error() : this.reservas.error();
    return e ? mensajeDeError(e) : null;
  });

  protected cambiarVista(vista: Vista): void {
    this.pagina.set(0);
    void this.router.navigate([], { queryParams: { vista } });
  }

  protected filtrar(
    filtro: 'mias' | 'desde' | 'hasta' | 'estadoVenta' | 'estadoReserva',
    valor: string | boolean,
  ): void {
    switch (filtro) {
      case 'mias':
        this.soloMias.set(valor as boolean);
        break;
      case 'desde':
        this.desde.set(valor as string);
        break;
      case 'hasta':
        this.hasta.set(valor as string);
        break;
      case 'estadoVenta':
        this.estadoVentaFiltro.set((valor || undefined) as EstadoVenta | undefined);
        break;
      case 'estadoReserva':
        this.estadoReservaFiltro.set((valor || undefined) as EstadoReserva | undefined);
        break;
    }
    this.pagina.set(0);
  }

  protected reintentar(): void {
    if (this.actual() === 'ventas') this.ventas.reload();
    else this.reservas.reload();
  }
}
