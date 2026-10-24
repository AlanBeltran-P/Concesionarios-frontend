import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { urlDelBackend } from '../../../../shared/utils/http';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ETIQUETA_CONDICION, ETIQUETA_ESTADO, OPCIONES_ORDEN } from '../../logic';
import { CondicionVehiculo, EstadoVehiculo, FiltroVehiculos, OrdenVehiculos } from '../../model';
import { AuthService } from '../../../auth/services/auth.service';
import { VehiculosService } from '../../services/vehiculos.service';
import { EstadoBadge } from '../estado-badge/estado-badge';

const POR_PAGINA = 12;

/** Inventario para empleados: búsqueda, filtros, orden y paginado. */
@Component({
  selector: 'app-listado-vehiculos',
  imports: [RouterLink, Icono, EstadoBadge],
  templateUrl: './listado-vehiculos.html',
})
export class ListadoVehiculos {
  private readonly servicio = inject(VehiculosService);
  private readonly auth = inject(AuthService);
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');

  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearKm = formatearKm;
  protected readonly url = urlDelBackend;
  protected readonly etiquetaCondicion = ETIQUETA_CONDICION;
  protected readonly opcionesOrden = OPCIONES_ORDEN;
  protected readonly estados = Object.entries(ETIQUETA_ESTADO) as [EstadoVehiculo, string][];
  protected readonly condiciones = Object.entries(ETIQUETA_CONDICION) as [
    CondicionVehiculo,
    string,
  ][];

  // Filtros
  protected readonly texto = signal('');
  private readonly textoBuscado = signal('');
  protected readonly marcaId = signal<number | undefined>(undefined);
  protected readonly estado = signal<EstadoVehiculo | undefined>(undefined);
  protected readonly condicion = signal<CondicionVehiculo | undefined>(undefined);
  protected readonly orden = signal<OrdenVehiculos>('fechaIngreso,desc');
  protected readonly pagina = signal(0);
  private temporizadorTexto?: ReturnType<typeof setTimeout>;

  protected readonly hayFiltros = computed(
    () => !!this.textoBuscado() || !!this.marcaId() || !!this.estado() || !!this.condicion(),
  );

  private readonly filtro = computed<FiltroVehiculos>(() => ({
    texto: this.textoBuscado().trim() || undefined,
    marcaId: this.marcaId(),
    estado: this.estado(),
    condicion: this.condicion(),
    sort: this.orden(),
    page: this.pagina(),
    size: POR_PAGINA,
  }));

  protected readonly resultado = rxResource({
    params: () => this.filtro(),
    stream: ({ params }) => this.servicio.buscar(params),
  });

  private readonly marcas = rxResource({ stream: () => this.servicio.marcas() });

  protected readonly datos = computed(() => valorDe(this.resultado));
  protected readonly listaMarcas = computed(() => valorDe(this.marcas));

  protected readonly error = computed(() => {
    const e = this.resultado.error();
    return e ? mensajeDeError(e) : null;
  });

  /** "1–12 de 48" */
  protected readonly rango = computed(() => {
    const p = this.datos()?.page;
    if (!p || p.totalElements === 0) return '';
    const desde = p.number * p.size + 1;
    const hasta = Math.min(desde + p.size - 1, p.totalElements);
    return `${desde}–${hasta} de ${p.totalElements}`;
  });

  protected buscarTexto(valor: string): void {
    this.texto.set(valor);
    clearTimeout(this.temporizadorTexto);
    // Espera a que termine de escribir para no pedir una búsqueda por cada letra.
    this.temporizadorTexto = setTimeout(() => {
      this.textoBuscado.set(valor);
      this.pagina.set(0);
    }, 300);
  }

  protected filtrarMarca(valor: string): void {
    this.marcaId.set(valor ? Number(valor) : undefined);
    this.pagina.set(0);
  }

  protected filtrarEstado(valor: string): void {
    this.estado.set((valor || undefined) as EstadoVehiculo | undefined);
    this.pagina.set(0);
  }

  protected filtrarCondicion(valor: string): void {
    this.condicion.set((valor || undefined) as CondicionVehiculo | undefined);
    this.pagina.set(0);
  }

  protected ordenar(valor: string): void {
    this.orden.set(valor as OrdenVehiculos);
    this.pagina.set(0);
  }

  protected limpiarFiltros(): void {
    clearTimeout(this.temporizadorTexto);
    this.texto.set('');
    this.textoBuscado.set('');
    this.marcaId.set(undefined);
    this.estado.set(undefined);
    this.condicion.set(undefined);
    this.pagina.set(0);
  }

  protected irAPagina(numero: number): void {
    this.pagina.set(numero);
  }
}
