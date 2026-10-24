import { HttpErrorResponse } from '@angular/common/http';

/** Formato de error del backend (ProblemDetail, RFC 9457). */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  /** Solo en errores de validación: { campo: mensaje } */
  errores?: Record<string, string>;
}

/** Convierte un error HTTP en un mensaje para mostrarle al usuario. */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  const problema = error.error as Partial<ProblemDetail> | null;
  return problema?.detail ?? 'Ocurrió un error inesperado.';
}
