import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import { Cliente, ClienteRequest, FiltroClientes, HistorialCliente } from '../model';

/** Clientes del panel (ADMIN y VENDEDOR). */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  /** Busca por nombre, apellido, email o documento. Ordenados por apellido. */
  buscar(filtro: FiltroClientes): Observable<Pagina<Cliente>> {
    return this.http.get<Pagina<Cliente>>(this.url, {
      params: aParams({ ...filtro, sort: 'apellido,asc' }),
    });
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  crear(datos: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, datos);
  }

  actualizar(id: number, datos: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.url}/${id}`, datos);
  }

  historial(id: number): Observable<HistorialCliente> {
    return this.http.get<HistorialCliente>(`${this.url}/${id}/historial`);
  }
}
