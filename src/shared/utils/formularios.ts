import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { ProblemDetail, mensajeDeError } from './mensaje-error';

/**
 * Muestra los errores del backend debajo de cada campo del formulario (error "servidor").
 * - Errores de validación: vienen en "errores" con el nombre del campo (ej. "direccion.calle").
 * - Conflictos sin campo (ej. "Ya existe un cliente con DNI ..."): se asignan con porMensaje,
 *   una lista de [patrón del mensaje, campo].
 * Devuelve el mensaje general a mostrar arriba, o null si todo quedó asignado a un campo.
 */
export function mostrarErroresEnFormulario(
  form: AbstractControl,
  err: unknown,
  porMensaje: [RegExp, string][] = [],
): string | null {
  const problema =
    err instanceof HttpErrorResponse ? (err.error as Partial<ProblemDetail> | null) : null;
  let errores = problema?.errores;
  if (!errores && problema?.detail) {
    const campo = porMensaje.find(([patron]) => patron.test(problema.detail!))?.[1];
    if (campo) errores = { [campo]: problema.detail };
  }
  let quedanSinCampo = !errores;
  for (const [campo, mensaje] of Object.entries(errores ?? {})) {
    const control = form.get(campo);
    if (control) {
      control.setErrors({ servidor: mensaje });
      control.markAsTouched();
    } else {
      quedanSinCampo = true;
    }
  }
  return quedanSinCampo ? mensajeDeError(err) : null;
}

/**
 * Igual que mostrarErroresEnFormulario, pero para formularios hechos con signals:
 * devuelve los errores por campo y el mensaje general (null si todo quedó en algún campo).
 */
export function erroresDelServidor(
  err: unknown,
  porMensaje: [RegExp, string][] = [],
): { campos: Record<string, string>; general: string | null } {
  const problema =
    err instanceof HttpErrorResponse ? (err.error as Partial<ProblemDetail> | null) : null;
  let campos = problema?.errores ?? {};
  if (!problema?.errores && problema?.detail) {
    const campo = porMensaje.find(([patron]) => patron.test(problema.detail!))?.[1];
    if (campo) campos = { [campo]: problema.detail };
  }
  return { campos, general: Object.keys(campos).length ? null : mensajeDeError(err) };
}
