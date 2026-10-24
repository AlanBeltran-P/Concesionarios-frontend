import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plan, PlanRequest, Simulacion, SimulacionRequest } from '../model';

/** Planes de financiación (RF-28) y simulador de cuotas (RF-29). */
@Injectable({ providedIn: 'root' })
export class PlanesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/planes`;

  /** Los activos. Con incluirInactivos (solo ADMIN) trae todos. */
  listar(incluirInactivos = false): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.url, { params: { incluirInactivos } });
  }

  /** Sistema francés: cuota fija. Valida el plazo y el anticipo mínimo del plan. */
  simular(datos: SimulacionRequest): Observable<Simulacion> {
    return this.http.post<Simulacion>(`${this.url}/simulacion`, datos);
  }

  /** Solo ADMIN. Crea si no hay id. */
  guardar(id: number | undefined, datos: PlanRequest): Observable<Plan> {
    return id === undefined
      ? this.http.post<Plan>(this.url, datos)
      : this.http.put<Plan>(`${this.url}/${id}`, datos);
  }

  /** Solo ADMIN. Un plan desactivado no se ofrece en ventas nuevas. */
  activar(id: number, activo: boolean): Observable<Plan> {
    return this.http.patch<Plan>(`${this.url}/${id}/estado`, { activo });
  }
}
