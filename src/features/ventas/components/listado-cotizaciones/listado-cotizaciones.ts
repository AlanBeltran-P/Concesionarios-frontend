import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { ESTADO_COTIZACION } from '../../logic';
import { EstadoCotizacion, FiltroCotizaciones } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';
import { EsqueletoFilas } from '../../../../shared/ui/carga/esqueleto-filas';

type Vista = 'pendientes' | 'mias' | 'todas';

const VISTAS: { vista: Vista; texto: string }[] = [
  { vista: 'pendientes', texto: 'Pendientes' },
  { vista: 'mias', texto: 'Mías' },
  { vista: 'todas', texto: 'Todas' },
];

const POR_PAGINA = 20;

/** Cotizaciones: las pedidas en el portal sin atender, las propias y todas. */
@Component({
  selector: 'app-listado-cotizaciones',
  imports: [EsqueletoFilas, RouterLink, Icono, Etiqueta],
  templateUrl: './listado-cotizaciones.html',
})
export class ListadoCotizaciones {
  private readonly servicio = inject(CotizacionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?vista= de la URL. */
  readonly vista = input<string>();

  protected readonly vistas = VISTAS;
  protected readonly estadoCotizacion = ESTADO_COTIZACION;
  protected readonly estados = Object.entries(ESTADO_COTIZACION) as [
    EstadoCotizacion,
    { texto: string },
  ][];
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;

  protected readonly actual = computed<Vista>(() =>
    VISTAS.some((v) => v.vista === this.vista()) ? (this.vista() as Vista) : 'pendientes',
  );
  protected readonly estado = signal<EstadoCotizacion | undefined>(undefined);
  protected readonly pagina = signal(0);

  private readonly resultado = rxResource({
    params: (): FiltroCotizaciones => {
      const base = { page: this.pagina(), size: POR_PAGINA };
      switch (this.actual()) {
        case 'pendientes':
          return { ...base, estado: 'SOLICITADA', sinAsignar: true };
        case 'mias':
          return { ...base, estado: this.estado(), vendedorId: this.auth.usuario()?.id };
        case 'todas':
          return { ...base, estado: this.estado() };
      }
    },
    stream: ({ params }) => this.servicio.buscar(params),
  });
  protected readonly datos = computed(() => valorDe(this.resultado));
  protected readonly cargando = computed(() => this.resultado.isLoading());
  protected readonly error = computed(() => {
    const e = this.resultado.error();
    return e ? mensajeDeError(e) : null;
  });
  protected readonly rango = computed(() => {
    const p = this.datos()?.page;
    if (!p || p.totalElements === 0) return '';
    const desde = p.number * p.size + 1;
    return `${desde}–${Math.min(desde + p.size - 1, p.totalElements)} de ${p.totalElements}`;
  });
  protected readonly textoVacio = computed(() => {
    switch (this.actual()) {
      case 'pendientes':
        return 'No hay pedidos del portal esperando respuesta.';
      case 'mias':
        return 'No tenés cotizaciones' + (this.estado() ? ' en ese estado.' : ' todavía.');
      case 'todas':
        return 'No hay cotizaciones' + (this.estado() ? ' en ese estado.' : ' todavía.');
    }
  });

  protected cambiarVista(vista: Vista): void {
    this.pagina.set(0);
    this.estado.set(undefined);
    void this.router.navigate([], { queryParams: { vista } });
  }

  protected filtrarEstado(valor: string): void {
    this.estado.set((valor || undefined) as EstadoCotizacion | undefined);
    this.pagina.set(0);
  }

  protected reintentar(): void {
    this.resultado.reload();
  }
}
