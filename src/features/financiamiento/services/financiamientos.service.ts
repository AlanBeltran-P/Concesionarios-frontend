import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { hoyISO } from '../../../shared/utils/formato';
import { aParams } from '../../../shared/utils/http';
import {
  Cuota,
  EstadoCuenta,
  FiltroCuotas,
  FiltroFinanciamientos,
  FinanciamientoResumen,
  Pago,
  RegistrarPago,
  ResultadoVencimientos,
} from '../model';

/** Financiamientos, estado de cuenta (RF-32), pagos (RF-31) y mora (RF-33). */
@Injectable({ providedIn: 'root' })
export class FinanciamientosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  buscar(filtro: FiltroFinanciamientos): Observable<Pagina<FinanciamientoResumen>> {
    return this.http.get<Pagina<FinanciamientoResumen>>(`${this.api}/financiamientos`, {
      params: aParams(filtro),
    });
  }

  /** RF-32: el estado de cuenta de cada financiamiento del cliente logueado. */
  mios(): Observable<EstadoCuenta[]> {
    return this.http.get<EstadoCuenta[]>(`${this.api}/financiamientos/mios`);
  }

  estadoDeCuenta(id: number): Observable<EstadoCuenta> {
    return this.http.get<EstadoCuenta>(`${this.api}/financiamientos/${id}`);
  }

  deVenta(ventaId: number): Observable<EstadoCuenta> {
    return this.http.get<EstadoCuenta>(`${this.api}/financiamientos/venta/${ventaId}`);
  }

  cuotas(filtro: FiltroCuotas): Observable<Pagina<Cuota>> {
    return this.http.get<Pagina<Cuota>>(`${this.api}/cuotas`, { params: aParams(filtro) });
  }

  registrarPago(datos: RegistrarPago): Observable<Pago> {
    return this.http.post<Pago>(`${this.api}/pagos`, datos);
  }

  /** Solo ADMIN. Normalmente lo hace el proceso diario. */
  procesarVencimientos(): Observable<ResultadoVencimientos> {
    return this.http.post<ResultadoVencimientos>(`${this.api}/cuotas/procesar-vencimientos`, null, {
      params: { fecha: hoyISO() },
    });
  }
}
