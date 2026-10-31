import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { Categoria, Marca, Modelo } from '../../model';
import { VehiculosService } from '../../services/vehiculos.service';
import { EsqueletoLineas } from '../../../../shared/ui/carga/esqueleto-lineas';

const porNombre = (a: { nombre: string }, b: { nombre: string }) =>
  a.nombre.localeCompare(b.nombre, 'es');

/** Lista editable de modelos. Cada modelo pertenece a una marca y a una categoría. */
@Component({
  selector: 'app-catalogo-modelos',
  imports: [EsqueletoLineas],
  templateUrl: './catalogo-modelos.html',
})
export class CatalogoModelos {
  private readonly servicio = inject(VehiculosService);

  private readonly modelos = rxResource({
    stream: () => this.servicio.listarCatalogo<Modelo>('modelos'),
  });
  private readonly marcas = rxResource({
    stream: () => this.servicio.listarCatalogo<Marca>('marcas'),
  });
  private readonly categorias = rxResource({
    stream: () => this.servicio.listarCatalogo<Categoria>('categorias'),
  });

  /** Para elegir en un modelo nuevo o editado solo sirven las activas. */
  protected readonly marcasActivas = computed(() =>
    (valorDe(this.marcas) ?? []).filter((m) => m.activo).sort(porNombre),
  );
  protected readonly categoriasActivas = computed(() =>
    (valorDe(this.categorias) ?? []).filter((c) => c.activo).sort(porNombre),
  );
  /** Para el filtro, todas las marcas que tengan modelos. */
  protected readonly marcasConModelos = computed(() => {
    const ids = new Set((valorDe(this.modelos) ?? []).map((m) => m.marcaId));
    return (valorDe(this.marcas) ?? []).filter((m) => ids.has(m.id)).sort(porNombre);
  });

  protected readonly filtroMarca = signal<number | null>(null);
  protected readonly lista = computed(() =>
    (valorDe(this.modelos) ?? [])
      .filter((m) => this.filtroMarca() === null || m.marcaId === this.filtroMarca())
      .sort(
        (a, b) =>
          Number(b.activo) - Number(a.activo) ||
          a.marcaNombre.localeCompare(b.marcaNombre, 'es') ||
          porNombre(a, b),
      ),
  );
  protected readonly cargando = computed(
    () => this.modelos.isLoading() && !this.modelos.hasValue(),
  );
  protected readonly errorCarga = computed(() => {
    const e = this.modelos.error() ?? this.marcas.error() ?? this.categorias.error();
    return e ? mensajeDeError(e) : null;
  });
  /** Sin marcas o categorías activas no se puede cargar ningún modelo. */
  protected readonly faltanDatos = computed(
    () =>
      this.marcas.hasValue() &&
      this.categorias.hasValue() &&
      (!this.marcasActivas().length || !this.categoriasActivas().length),
  );

  // Alta
  protected readonly marcaId = signal<number | null>(null);
  protected readonly categoriaId = signal<number | null>(null);
  protected readonly nombre = signal('');
  protected readonly intentoAgregar = signal(false);
  protected readonly altaIncompleta = computed(
    () => !this.marcaId() || !this.categoriaId() || !this.nombre().trim(),
  );

  // Edición
  protected readonly editandoId = signal<number | null>(null);
  protected readonly marcaEditada = signal<number | null>(null);
  protected readonly categoriaEditada = signal<number | null>(null);
  protected readonly nombreEditado = signal('');

  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected numero(valor: string): number | null {
    return valor ? Number(valor) : null;
  }

  protected agregar(): void {
    this.intentoAgregar.set(true);
    if (this.altaIncompleta()) return;
    this.ejecutar(
      this.servicio.guardarEnCatalogo('modelos', undefined, {
        nombre: this.nombre().trim(),
        marcaId: this.marcaId(),
        categoriaId: this.categoriaId(),
      }),
      () => {
        // Deja la marca y la categoría elegidas: lo común es cargar varios modelos seguidos.
        this.nombre.set('');
        this.intentoAgregar.set(false);
      },
    );
  }

  protected editar(m: Modelo): void {
    this.error.set(null);
    this.editandoId.set(m.id);
    this.marcaEditada.set(m.marcaId);
    this.categoriaEditada.set(m.categoriaId);
    this.nombreEditado.set(m.nombre);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.error.set(null);
  }

  protected guardarEdicion(id: number): void {
    if (!this.nombreEditado().trim() || !this.marcaEditada() || !this.categoriaEditada()) return;
    this.ejecutar(
      this.servicio.guardarEnCatalogo('modelos', id, {
        nombre: this.nombreEditado().trim(),
        marcaId: this.marcaEditada(),
        categoriaId: this.categoriaEditada(),
      }),
      () => this.editandoId.set(null),
    );
  }

  protected cambiarActivo(m: Modelo): void {
    this.ejecutar(this.servicio.activarEnCatalogo('modelos', m.id, !m.activo));
  }

  private ejecutar(accion: Observable<unknown>, alTerminar?: () => void): void {
    this.ocupado.set(true);
    this.error.set(null);
    accion.subscribe({
      next: () => {
        alTerminar?.();
        this.modelos.reload();
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }
}
