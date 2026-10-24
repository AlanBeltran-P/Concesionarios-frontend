import { Routes } from '@angular/router';
import { invitadoGuard } from '../features/auth/logic';

// Las pantallas de cada feature se cargan recién cuando se navega a ellas.
// Las rutas del panel de gestión van con canActivate: [authGuard].
export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión · Concesionaria',
    loadComponent: () => import('../features/auth/components/login/login').then((m) => m.Login),
  },
  { path: 'auth', pathMatch: 'full', redirectTo: 'auth/login' },
];
