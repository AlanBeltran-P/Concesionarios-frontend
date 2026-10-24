import { Resource } from '@angular/core';

/**
 * El valor de un resource, o undefined si todavía no cargó o falló.
 * Leer resource.value() cuando el pedido falló tira una excepción, así que en plantillas
 * y computed siempre se lee con esto.
 */
export function valorDe<T>(recurso: Resource<T>): T | undefined {
  return recurso.hasValue() ? recurso.value() : undefined;
}
