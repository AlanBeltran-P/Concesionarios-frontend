import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, Rol, Sesion, TokenResponse } from '../model';

const CLAVE_SESION = 'concesionaria.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesion = signal<Sesion | null>(leerSesionGuardada());
  private refreshEnCurso: Observable<string> | null = null;

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  get accessToken(): string | null {
    return this.sesion()?.accessToken ?? null;
  }

  login(datos: LoginRequest): Observable<void> {
    return this.http.post<TokenResponse>(`${this.url}/login`, datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map(() => undefined),
    );
  }

  /**
   * Pide un access token nuevo con el refresh token.
   * El refresh token se puede usar una sola vez, así que si varios pedidos
   * reciben 401 al mismo tiempo, todos esperan el mismo refresh.
   */
  refrescarToken(): Observable<string> {
    const refreshToken = this.sesion()?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No hay sesión para renovar'));
    }
    this.refreshEnCurso ??= this.http
      .post<TokenResponse>(`${this.url}/refresh`, { refreshToken })
      .pipe(
        tap((respuesta) => this.guardarSesion(respuesta)),
        map((respuesta) => respuesta.accessToken),
        finalize(() => (this.refreshEnCurso = null)),
        shareReplay(1),
      );
    return this.refreshEnCurso;
  }

  logout(): void {
    const refreshToken = this.sesion()?.refreshToken;
    if (refreshToken) {
      // Invalida el refresh token en el backend. Si falla, igual cerramos la sesión local.
      this.http.post(`${this.url}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    this.cerrarSesionLocal();
  }

  /** Borra la sesión del navegador y vuelve al login. */
  cerrarSesionLocal(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Sin acceso al storage no hay nada que borrar.
    }
    void this.router.navigate(['/auth/login']);
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return rol !== undefined && roles.includes(rol);
  }

  private guardarSesion({ accessToken, refreshToken, usuario }: TokenResponse): void {
    const sesion: Sesion = { accessToken, refreshToken, usuario };
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin storage la sesión dura hasta recargar la página.
    }
  }
}

function leerSesionGuardada(): Sesion | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? (JSON.parse(guardada) as Sesion) : null;
  } catch {
    return null;
  }
}
