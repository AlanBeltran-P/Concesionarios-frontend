import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Endpoints de auth que no llevan token (y donde un 401 no debe disparar un refresh). */
const RUTAS_SIN_TOKEN = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/registro',
  '/auth/recuperar-password',
  '/auth/restablecer-password',
].map((ruta) => environment.apiUrl + ruta);

/**
 * Agrega "Authorization: Bearer <token>" a los pedidos al backend.
 * Si el backend responde 401 (token vencido), renueva el token una vez y reintenta.
 * Si la renovación falla, cierra la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;

  const esDelBackend = req.url.startsWith(environment.apiUrl);
  const esRutaSinToken = RUTAS_SIN_TOKEN.some((ruta) => req.url.startsWith(ruta));
  if (!token || !esDelBackend || esRutaSinToken) {
    return next(req);
  }

  return next(conToken(req, token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== HttpStatusCode.Unauthorized) {
        return throwError(() => error);
      }
      return auth.refrescarToken().pipe(
        catchError(() => {
          auth.cerrarSesionLocal();
          return throwError(() => error);
        }),
        switchMap((nuevoToken) => next(conToken(req, nuevoToken))),
      );
    }),
  );
};

function conToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
