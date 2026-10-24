import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import { FiltroReservas, FiltroVentas, NuevaReserva, NuevaVenta, Reserva, Venta } from '../model';

/** Reservas con seña (RF-21, RF-22, RF-26) y ventas (RF-23 a RF-27). */
@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly urlReservas = `${environment.apiUrl}/reservas`;
  private readonly urlVentas = `${environment.apiUrl}/ventas`;

  buscarReservas(filtro: FiltroReservas): Observable<Pagina<Reserva>> {
    return this.http.get<Pagina<Reserva>>(this.urlReservas, { params: aParams(filtro) });
  }

  obtenerReserva(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.urlReservas}/${id}`);
  }

  reservar(datos: NuevaReserva): Observable<Reserva> {
    return this.http.post<Reserva>(this.urlReservas, datos);
  }

  /** Solo ADMIN. El vehículo vuelve a estar disponible. */
  anularReserva(id: number, motivo: string): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.urlReservas}/${id}/anular`, { motivo });
  }

  buscarVentas(filtro: FiltroVentas): Observable<Pagina<Venta>> {
    return this.http.get<Pagina<Venta>>(this.urlVentas, { params: aParams(filtro) });
  }

  obtenerVenta(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.urlVentas}/${id}`);
  }

  vender(datos: NuevaVenta): Observable<Venta> {
    return this.http.post<Venta>(this.urlVentas, datos);
  }

  /** Solo ADMIN. */
  anularVenta(id: number, motivo: string): Observable<Venta> {
    return this.http.post<Venta>(`${this.urlVentas}/${id}/anular`, { motivo });
  }

  /** PDF del comprobante (RF-27). Se pide con el token, por eso no alcanza con un link. */
  comprobante(id: number): Observable<Blob> {
    return this.http.get(`${this.urlVentas}/${id}/comprobante`, { responseType: 'blob' });
  }
}
