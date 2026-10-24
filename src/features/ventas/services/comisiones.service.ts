import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import { Comision, FiltroComisiones, ResumenComisiones } from '../model';

/** Comisiones de los vendedores (RF-25). Un vendedor solo ve las suyas (lo fuerza el backend). */
@Injectable({ providedIn: 'root' })
export class ComisionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/comisiones`;

  buscar(filtro: FiltroComisiones): Observable<Pagina<Comision>> {
    return this.http.get<Pagina<Comision>>(this.url, { params: aParams(filtro) });
  }

  resumen(
    filtro: Omit<FiltroComisiones, 'estado' | 'page' | 'size'>,
  ): Observable<ResumenComisiones> {
    return this.http.get<ResumenComisiones>(`${this.url}/resumen`, { params: aParams(filtro) });
  }

  /** Solo ADMIN. */
  pagar(id: number): Observable<Comision> {
    return this.http.patch<Comision>(`${this.url}/${id}/pagar`, null);
  }
}
