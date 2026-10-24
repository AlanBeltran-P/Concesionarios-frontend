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
  return auth.autenticado() ? router.createUrlTree(['/']) : true;
};

/** Adónde ir después del login. Solo rutas internas, para que ?redirect= no pueda mandar a otro sitio. */
export function destinoDespuesDelLogin(redirect: string | undefined): string {
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
}

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
