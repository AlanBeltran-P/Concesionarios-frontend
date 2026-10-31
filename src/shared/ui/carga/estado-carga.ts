import { Injectable, computed, signal } from '@angular/core';

/** Lleva la cuenta de lo que se está cargando en toda la app (pedidos al backend y navegación). */
@Injectable({ providedIn: 'root' })
export class EstadoCarga {
  private readonly pedidos = signal(0);
  readonly navegando = signal(false);

  /** Hay algún pedido en curso o se está cambiando de pantalla. */
  readonly ocupado = computed(() => this.pedidos() > 0 || this.navegando());

  empezoPedido(): void {
    this.pedidos.update((n) => n + 1);
  }

  terminoPedido(): void {
    this.pedidos.update((n) => Math.max(0, n - 1));
  }
}
