import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import { FiltroUsuarios, NuevoEmpleado, Rol, Usuario } from '../model';

/** Usuarios del sistema (RF-01, RF-06). Solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  buscar(filtro: FiltroUsuarios): Observable<Pagina<Usuario>> {
    return this.http.get<Pagina<Usuario>>(this.url, { params: aParams(filtro) });
  }

  crear(datos: NuevoEmpleado): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, datos);
  }

  cambiarRol(id: number, rol: Rol): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/rol`, { rol });
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/estado`, { activo });
  }
}
