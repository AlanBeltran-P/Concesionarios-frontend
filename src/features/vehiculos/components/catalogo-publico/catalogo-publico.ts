import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { OPCIONES_ORDEN } from '../../logic';
import { CondicionVehiculo, FiltroVehiculos, OrdenVehiculos } from '../../model';
import { VehiculosService } from '../../services/vehiculos.service';
import { TarjetaVehiculo } from '../tarjeta-vehiculo/tarjeta-vehiculo';

const POR_PAGINA = 12;

/** Topes del buscador del inicio. */
export const PRECIOS_MAXIMOS = [15_000_000, 25_000_000, 40_000_000, 60_000_000];

/**
 * Catálogo público (inicio del sitio, RF-12). Los filtros viven en la URL
 * (?marcaId=1&condicion=USADO&pagina=2) para poder compartir una búsqueda.
 */
@Component({
  selector: 'app-catalogo-publico',
  imports: [Icono, TarjetaVehiculo],
  templateUrl: './catalogo-publico.html',
})
export class CatalogoPublico {
  private readonly servicio = inject(VehiculosService);
  private readonly router = inject(Router);

  // Query params
  readonly marcaId = input<string>();
  readonly modeloId = input<string>();
  readonly categoriaId = input<string>();
  readonly condicion = input<string>();
  readonly precioMax = input<string>();
  readonly anioMin = input<string>();
  readonly texto = input<string>();
  readonly orden = input<string>();
  readonly pagina = input<string>();

  protected readonly precios = PRECIOS_MAXIMOS;
  protected readonly opcionesOrden = OPCIONES_ORDEN;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly anios = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);

  protected readonly filtro = computed<FiltroVehiculos>(() => {
    const num = (v: string | undefined) => (v && !isNaN(Number(v)) ? Number(v) : undefined);
    const orden = OPCIONES_ORDEN.some((o) => o.valor === this.orden())
      ? (this.orden() as OrdenVehiculos)
      : 'fechaIngreso,desc';
    return {
      marcaId: num(this.marcaId()),
      modeloId: num(this.modeloId()),
      categoriaId: num(this.categoriaId()),
      condicion: ['NUEVO', 'USADO'].includes(this.condicion() ?? '')
        ? (this.condicion() as CondicionVehiculo)
        : undefined,
      precioMax: num(this.precioMax()),
      anioMin: num(this.anioMin()),
      texto: this.texto()?.trim() || undefined,
      // Aunque entre un empleado logueado, el catálogo público muestra solo los disponibles.
      estado: 'DISPONIBLE',
      sort: orden,
      page: Math.max(0, (num(this.pagina()) ?? 1) - 1),
      size: POR_PAGINA,
    };
  });

  private readonly resultado = rxResource({
    params: () => this.filtro(),
    stream: ({ params }) => this.servicio.buscar(params),
  });
  protected readonly datos = computed(() => valorDe(this.resultado));
  protected readonly cargando = computed(() => this.resultado.isLoading());
  protected readonly error = computed(() => {
    const e = this.resultado.error();
    return e ? mensajeDeError(e) : null;
  });

  private readonly marcasRecurso = rxResource({ stream: () => this.servicio.marcas() });
  private readonly categoriasRecurso = rxResource({ stream: () => this.servicio.categorias() });
  protected readonly marcas = computed(() => valorDe(this.marcasRecurso) ?? []);
  protected readonly categorias = computed(() => valorDe(this.categoriasRecurso) ?? []);

  /** El buscador del inicio tiene su propia marca elegida hasta que se toca "Buscar". */
  protected readonly marcaBuscador = linkedSignal(() => this.filtro().marcaId ?? null);
  protected readonly modeloBuscador = linkedSignal(() => this.filtro().modeloId ?? null);
  protected readonly precioBuscador = linkedSignal(() => this.filtro().precioMax ?? null);
  private readonly modelosRecurso = rxResource({
    params: () => this.marcaBuscador() ?? undefined,
    stream: ({ params }) => (params ? this.servicio.modelos(params) : of([])),
  });
  protected readonly modelos = computed(() => valorDe(this.modelosRecurso) ?? []);

  protected readonly hayFiltros = computed(() => {
    const f = this.filtro();
    return !!(f.marcaId || f.modeloId || f.categoriaId || f.condicion || f.precioMax || f.anioMin || f.texto);
  });

  protected numero(valor: string): number | null {
    return valor ? Number(valor) : null;
  }

  /** Cambia filtros en la URL y vuelve a la página 1. */
  protected filtrar(cambios: Record<string, string | number | null | undefined>, irAResultados = false): void {
    void this.router
      .navigate([], {
        queryParams: { ...cambios, pagina: null },
        queryParamsHandling: 'merge',
      })
      .then(() => {
        if (irAResultados) document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' });
      });
  }

  protected buscar(): void {
    this.filtrar(
      { marcaId: this.marcaBuscador(), modeloId: this.modeloBuscador(), precioMax: this.precioBuscador() },
      true,
    );
  }

  protected limpiar(): void {
    void this.router.navigate([], { queryParams: {} });
  }

  protected irAPagina(numero: number): void {
    void this.router
      .navigate([], { queryParams: { pagina: numero + 1 }, queryParamsHandling: 'merge' })
      .then(() => document.getElementById('resultados')?.scrollIntoView());
  }
}
