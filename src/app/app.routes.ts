import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from '../features/auth/logic';
import { PANEL_ROUTES } from './panel.routes';

// Las pantallas se cargan recién cuando se navega a ellas.
// Mientras no exista el sitio público, "/" lleva al panel (y el panel, al login si no hay sesión).
export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión · Concesionaria',
    loadComponent: () => import('../features/auth/components/login/login').then((m) => m.Login),
  },
  { path: 'auth', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'panel',
    canActivate: [authGuard, rolGuard('ADMIN', 'VENDEDOR')],
    loadComponent: () =>
      import('../shared/ui/panel-layout/panel-layout').then((m) => m.PanelLayout),
    children: PANEL_ROUTES,
  },
  {
    path: 'sin-acceso',
    canActivate: [authGuard],
    title: 'Sin acceso · Concesionaria',
    loadComponent: () => import('../shared/ui/sin-acceso/sin-acceso').then((m) => m.SinAcceso),
  },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
