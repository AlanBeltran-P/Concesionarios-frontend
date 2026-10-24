import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { formatearDocumento, nombreCompleto } from '../../logic';
import { FiltroClientes, OrigenCliente } from '../../model';
import { ClientesService } from '../../services/clientes.service';

const POR_PAGINA = 20;

/** Clientes de la concesionaria: búsqueda y paginado. */
@Component({
  selector: 'app-listado-clientes',
  imports: [RouterLink, Icono, Etiqueta],
  templateUrl: './listado-clientes.html',
})
export class ListadoClientes {
  private readonly servicio = inject(ClientesService);

  protected readonly formatearDocumento = formatearDocumento;
  protected readonly nombreCompleto = nombreCompleto;

  protected readonly texto = signal('');
  private readonly textoBuscado = signal('');
  protected readonly origen = signal<OrigenCliente | undefined>(undefined);
  protected readonly pagina = signal(0);
  private temporizadorTexto?: ReturnType<typeof setTimeout>;

  protected readonly hayFiltros = computed(() => !!this.textoBuscado() || !!this.origen());

  private readonly resultado = rxResource({
    params: (): FiltroClientes => ({
      texto: this.textoBuscado().trim() || undefined,
      origen: this.origen(),
      page: this.pagina(),
      size: POR_PAGINA,
    }),
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
    const hasta = Math.min(desde + p.size - 1, p.totalElements);
    return `${desde}–${hasta} de ${p.totalElements}`;
  });

  protected buscarTexto(valor: string): void {
    this.texto.set(valor);
    clearTimeout(this.temporizadorTexto);
    this.temporizadorTexto = setTimeout(() => {
      this.textoBuscado.set(valor);
      this.pagina.set(0);
    }, 300);
  }

  protected filtrarOrigen(valor: string): void {
    this.origen.set((valor || undefined) as OrigenCliente | undefined);
    this.pagina.set(0);
  }

  protected limpiarFiltros(): void {
    clearTimeout(this.temporizadorTexto);
    this.texto.set('');
    this.textoBuscado.set('');
    this.origen.set(undefined);
    this.pagina.set(0);
  }

  protected reintentar(): void {
    this.resultado.reload();
  }
}
