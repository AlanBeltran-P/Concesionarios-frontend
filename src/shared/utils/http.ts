import { HttpParams } from '@angular/common/http';

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
