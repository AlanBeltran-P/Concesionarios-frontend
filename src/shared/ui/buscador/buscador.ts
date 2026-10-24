import { Component, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { Icono } from '../icono/icono';

let siguienteId = 0;

/**
 * Campo para elegir un elemento buscándolo por texto (un cliente, un vehículo).
 * Muestra los resultados debajo mientras se escribe; al elegir uno queda como tarjeta con "Cambiar".
 */
@Component({
  selector: 'app-buscador',
  imports: [Icono],
  templateUrl: './buscador.html',
  host: { class: 'block' },
})
export class Buscador<T extends { id: number }> {
  /** Devuelve los resultados para un texto (vacío = los primeros). */
  readonly buscar = input.required<(texto: string) => Observable<T[]>>();
  readonly principal = input.required<(item: T) => string>();
  readonly secundario = input<(item: T) => string>(() => '');
  readonly placeholder = input('Buscar…');
  readonly vacio = input('No hay resultados.');
  readonly invalido = input(false);
  readonly deshabilitado = input(false);
  readonly etiqueta = input('');

  readonly seleccionado = model<T | null>(null);

  protected readonly idLista = `buscador-${++siguienteId}`;
  protected readonly texto = signal('');
  protected readonly abierto = signal(false);
  protected readonly buscando = signal(false);
  protected readonly resultados = signal<T[]>([]);
  protected readonly activo = signal(-1);

  private readonly termino = new Subject<string>();

  constructor() {
    this.termino
      .pipe(
        debounceTime(250),
        tap(() => this.buscando.set(true)),
        switchMap((t) => this.buscar()(t.trim()).pipe(catchError(() => of([] as T[])))),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        this.resultados.set(r);
        this.buscando.set(false);
        this.activo.set(r.length ? 0 : -1);
      });
  }

  protected escribir(valor: string): void {
    this.texto.set(valor);
    this.abierto.set(true);
    this.termino.next(valor);
  }

  protected abrir(): void {
    if (this.abierto()) return;
    this.abierto.set(true);
    this.termino.next(this.texto());
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected teclear(evento: KeyboardEvent): void {
    const total = this.resultados().length;
    if (evento.key === 'ArrowDown' && total) {
      evento.preventDefault();
      this.abrir();
      this.activo.set((this.activo() + 1) % total);
    } else if (evento.key === 'ArrowUp' && total) {
      evento.preventDefault();
      this.activo.set((this.activo() - 1 + total) % total);
    } else if (evento.key === 'Enter' && this.abierto() && this.activo() >= 0) {
      evento.preventDefault();
      this.elegir(this.resultados()[this.activo()]);
    } else if (evento.key === 'Escape') {
      this.cerrar();
    }
  }

  protected elegir(item: T): void {
    this.seleccionado.set(item);
    this.abierto.set(false);
    this.texto.set('');
  }

  protected cambiar(): void {
    this.seleccionado.set(null);
  }
}
