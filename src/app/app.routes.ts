import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from '../features/auth/logic';
import { PANEL_ROUTES } from './panel.routes';

// Las pantallas se cargan recién cuando se navega a ellas.
// "/" es el sitio público; los empleados trabajan en /panel.
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
  {
    path: '',
    loadComponent: () => import('../shared/ui/sitio-layout/sitio-layout').then((m) => m.SitioLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Concesionaria · Autos 0 km y usados',
        loadComponent: () =>
          import('../features/vehiculos/components/catalogo-publico/catalogo-publico').then(
            (m) => m.CatalogoPublico,
          ),
      },
      {
        path: 'vehiculos/:id',
        title: 'Vehículo · Concesionaria',
        loadComponent: () =>
          import('../features/vehiculos/components/detalle-publico/detalle-publico').then(
            (m) => m.DetallePublico,
          ),
      },
      {
        path: 'financiacion',
        title: 'Financiación · Concesionaria',
        loadComponent: () =>
          import(
            '../features/financiamiento/components/financiacion-publica/financiacion-publica'
          ).then((m) => m.FinanciacionPublica),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
