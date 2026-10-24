import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../../shared/types/pagina';
import { aParams } from '../../../shared/utils/http';
import { FiltroNotificaciones, Notificacion } from '../model';

/** Historial de emails enviados (RF-38). Solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/notificaciones`;

  buscar(filtro: FiltroNotificaciones): Observable<Pagina<Notificacion>> {
    return this.http.get<Pagina<Notificacion>>(this.url, { params: aParams(filtro) });
  }

  /** Con el cuerpo del email. */
  obtener(id: number): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.url}/${id}`);
  }

  reenviar(id: number): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${this.url}/${id}/reenviar`, null);
  }
}
