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
    return auth.tieneRol(...roles) ? true : router.createUrlTree(['/']);
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
