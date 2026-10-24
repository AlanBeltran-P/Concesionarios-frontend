import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import {
  Categoria,
  EstadoVehiculo,
  FiltroVehiculos,
  Marca,
  Modelo,
  Vehiculo,
  VehiculoRequest,
  VehiculoResumen,
} from '../model';

/** Inventario de vehículos y sus catálogos (marcas, modelos, categorías). */
@Injectable({ providedIn: 'root' })
export class VehiculosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** Los empleados ven todos los estados; los dados de baja no aparecen. */
  buscar(filtro: FiltroVehiculos): Observable<Pagina<VehiculoResumen>> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<Pagina<VehiculoResumen>>(`${this.api}/vehiculos`, { params });
  }

  obtener(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.api}/vehiculos/${id}`);
  }

  crear(datos: VehiculoRequest): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.api}/vehiculos`, datos);
  }

  /** Solo ADMIN. */
  actualizar(id: number, datos: VehiculoRequest): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.api}/vehiculos/${id}`, datos);
  }

  /**
   * Manda también el estado que se está viendo: si otro usuario lo cambió mientras tanto,
   * el backend responde 409 en vez de pisarlo.
   */
  cambiarEstado(
    id: number,
    estado: EstadoVehiculo,
    estadoEsperado: EstadoVehiculo,
  ): Observable<Vehiculo> {
    return this.http.patch<Vehiculo>(`${this.api}/vehiculos/${id}/estado`, {
      estado,
      estadoEsperado,
    });
  }

  /** Baja lógica. Solo ADMIN. */
  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/vehiculos/${id}`);
  }

  /** Solo ADMIN. */
  reactivar(id: number): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.api}/vehiculos/${id}/reactivar`, null);
  }

  marcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.api}/marcas`);
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.api}/categorias`);
  }

  modelos(marcaId: number): Observable<Modelo[]> {
    return this.http.get<Modelo[]>(`${this.api}/modelos`, { params: { marcaId } });
  }
}
