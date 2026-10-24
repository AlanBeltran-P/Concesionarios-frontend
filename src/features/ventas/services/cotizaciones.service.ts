import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import {
  Cotizacion,
  FiltroCotizaciones,
  NuevaCotizacion,
  RespuestaCotizacion,
  Tasacion,
  TasacionRequest,
} from '../model';

/** Cotizaciones (RF-18, RF-19) y tasaciones de autos usados (RF-20). */
@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/cotizaciones`;
  private readonly urlTasaciones = `${environment.apiUrl}/tasaciones`;

  /** Las más nuevas primero. */
  buscar(filtro: FiltroCotizaciones): Observable<Pagina<Cotizacion>> {
    return this.http.get<Pagina<Cotizacion>>(this.url, { params: aParams(filtro) });
  }

  obtener(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.url}/${id}`);
  }

  /** Cotización para un cliente del local: queda RESPONDIDA. */
  crear(datos: NuevaCotizacion): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.url, datos);
  }

  /** Responder (o corregir la respuesta de) una cotización pedida desde el portal. */
  responder(id: number, datos: RespuestaCotizacion): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.url}/${id}/respuesta`, datos);
  }

  /** Registra lo que decidió el cliente. */
  decidir(id: number, decision: 'aceptar' | 'rechazar'): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/${id}/${decision}`, null);
  }

  /** Todas las tasaciones de un cliente, las más nuevas primero. */
  tasacionesDe(clienteId: number): Observable<Tasacion[]> {
    return this.http
      .get<Pagina<Tasacion>>(this.urlTasaciones, { params: aParams({ clienteId, size: 50 }) })
      .pipe(map((p) => p.content));
  }

  tasar(datos: TasacionRequest): Observable<Tasacion> {
    return this.http.post<Tasacion>(this.urlTasaciones, datos);
  }

  /** El cliente acepta o rechaza el valor ofrecido (lo registra el vendedor). */
  decidirTasacion(id: number, estado: 'ACEPTADA' | 'RECHAZADA'): Observable<Tasacion> {
    return this.http.patch<Tasacion>(`${this.urlTasaciones}/${id}/estado`, { estado });
  }
}
