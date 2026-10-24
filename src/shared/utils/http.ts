import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Arma los query params de un filtro, salteando los valores vacíos. */
export function aParams(filtro: object): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtro)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}

/**
 * URL completa de un recurso que el backend devuelve como ruta del gateway
 * (ej. "/api/vehiculos/1/imagenes/2/archivo").
 */
export function urlDelBackend(ruta: string): string {
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return base + ruta;
}
