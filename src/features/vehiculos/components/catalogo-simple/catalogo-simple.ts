import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { Categoria, Marca } from '../../model';
import { VehiculosService } from '../../services/vehiculos.service';

type Item = Marca & Partial<Pick<Categoria, 'descripcion'>>;

const TEXTOS = {
  marcas: {
    singular: 'marca',
    agregar: 'Agregar marca',
    ejemplo: 'Toyota',
    vacio: 'Todavía no hay marcas cargadas.',
  },
  categorias: {
    singular: 'categoría',
    agregar: 'Agregar categoría',
    ejemplo: 'SUV',
    vacio: 'Todavía no hay categorías cargadas.',
  },
};

/** Lista editable de marcas o de categorías: alta, edición en la misma fila y activar/desactivar. */
@Component({
  selector: 'app-catalogo-simple',
  templateUrl: './catalogo-simple.html',
})
export class CatalogoSimple {
  private readonly servicio = inject(VehiculosService);

  readonly tipo = input.required<'marcas' | 'categorias'>();

  protected readonly textos = computed(() => TEXTOS[this.tipo()]);
  protected readonly conDescripcion = computed(() => this.tipo() === 'categorias');

  private readonly items = rxResource({
    params: () => this.tipo(),
    stream: ({ params }) => this.servicio.listarCatalogo<Item>(params),
  });
  /** Activas primero, después por nombre. */
  protected readonly lista = computed(() =>
    [...(valorDe(this.items) ?? [])].sort(
      (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
    ),
  );
  protected readonly cargando = computed(() => this.items.isLoading() && !this.items.hasValue());
  protected readonly errorCarga = computed(() => {
    const e = this.items.error();
    return e ? mensajeDeError(e) : null;
  });

  protected readonly nombre = signal('');
  protected readonly descripcion = signal('');
  protected readonly editandoId = signal<number | null>(null);
  protected readonly nombreEditado = signal('');
  protected readonly descripcionEditada = signal('');
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Para no mostrar "completá el nombre" antes de que intente guardar. */
  protected readonly intentoAgregar = signal(false);

  protected agregar(): void {
    this.intentoAgregar.set(true);
    const nombre = this.nombre().trim();
    if (!nombre) return;
    this.ejecutar(
      this.servicio.guardarEnCatalogo(
        this.tipo(),
        undefined,
        this.datos(nombre, this.descripcion()),
      ),
      () => {
        this.nombre.set('');
        this.descripcion.set('');
        this.intentoAgregar.set(false);
      },
    );
  }

  protected editar(item: Item): void {
    this.error.set(null);
    this.editandoId.set(item.id);
    this.nombreEditado.set(item.nombre);
    this.descripcionEditada.set(item.descripcion ?? '');
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.error.set(null);
  }

  protected guardarEdicion(id: number): void {
    const nombre = this.nombreEditado().trim();
    if (!nombre) return;
    this.ejecutar(
      this.servicio.guardarEnCatalogo(
        this.tipo(),
        id,
        this.datos(nombre, this.descripcionEditada()),
      ),
      () => this.editandoId.set(null),
    );
  }

  protected cambiarActivo(item: Item): void {
    this.ejecutar(this.servicio.activarEnCatalogo(this.tipo(), item.id, !item.activo));
  }

  private datos(nombre: string, descripcion: string): object {
    return this.conDescripcion() ? { nombre, descripcion: descripcion.trim() || null } : { nombre };
  }

  private ejecutar(accion: Observable<unknown>, alTerminar?: () => void): void {
    this.ocupado.set(true);
    this.error.set(null);
    accion.subscribe({
      next: () => {
        alTerminar?.();
        this.items.reload();
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }
}
