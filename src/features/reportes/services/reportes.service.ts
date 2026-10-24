import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { aParams } from '../../../shared/utils/http';
import {
  Dashboard,
  Periodo,
  ReporteCartera,
  ReporteInventario,
  ReporteVentas,
  VentaDetalle,
} from '../model';

/** Reportes y dashboard (RF-39 a RF-42). Solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  dashboard(periodo: Periodo): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.url}/dashboard`, { params: aParams(periodo) });
  }

  ventas(periodo: Periodo & { vendedorId?: number }): Observable<ReporteVentas> {
    return this.http.get<ReporteVentas>(`${this.url}/ventas`, { params: aParams(periodo) });
  }

  ventasDetalle(periodo: Periodo & { vendedorId?: number }): Observable<VentaDetalle[]> {
    return this.http.get<VentaDetalle[]>(`${this.url}/ventas/detalle`, {
      params: aParams(periodo),
    });
  }

  inventario(): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(`${this.url}/inventario`);
  }

  cartera(): Observable<ReporteCartera> {
    return this.http.get<ReporteCartera>(`${this.url}/cartera`);
  }
}
