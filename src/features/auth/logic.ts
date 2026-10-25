import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from './model';
import { AuthService } from './services/auth.service';

/** Solo usuarios logueados. Si no lo está, lo manda al login y después lo trae de vuelta. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado()
    ? true
    : router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } });
};

/** Solo usuarios con alguno de estos roles. Usar después de authGuard. */
export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.tieneRol(...roles) ? true : router.createUrlTree(['/sin-acceso']);
  };

/** Para el login: si ya está logueado no tiene sentido mostrarlo. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? router.createUrlTree([inicioDe(auth.usuario()?.rol)]) : true;
};

/** La pantalla de inicio de cada rol: los empleados van al panel; los clientes, al sitio. */
export function inicioDe(rol: Rol | undefined): string {
  return rol === 'ADMIN' || rol === 'VENDEDOR' ? '/panel' : '/';
}

/**
 * Adónde ir después del login: la página que pidió (solo rutas internas, para que
 * ?redirect= no pueda mandar a otro sitio) o el inicio de su rol.
 */
export function destinoDespuesDelLogin(redirect: string | undefined, rol?: Rol): string {
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : inicioDe(rol);
}

/** Validación básica de email (la completa la hace el backend). */
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Misma regla que @PasswordSegura del backend. Devuelve el error o null. */
export function errorDePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72)
    return 'Tiene que tener entre 8 y 72 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return 'Tiene que tener al menos una letra y un número.';
  return null;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CLIENTE: 'Cliente',
};
