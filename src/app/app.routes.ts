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
  {
    path: 'auth/registro',
    canActivate: [invitadoGuard],
    title: 'Crear cuenta · Concesionaria',
    loadComponent: () =>
      import('../features/auth/components/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'auth/recuperar',
    canActivate: [invitadoGuard],
    title: 'Recuperar contraseña · Concesionaria',
    loadComponent: () =>
      import('../features/auth/components/recuperar-password/recuperar-password').then(
        (m) => m.RecuperarPassword,
      ),
  },
  {
    // El link del email de recuperación apunta acá (notificacion-service).
    path: 'restablecer-password',
    title: 'Nueva contraseña · Concesionaria',
    loadComponent: () =>
      import('../features/auth/components/restablecer-password/restablecer-password').then(
        (m) => m.RestablecerPassword,
      ),
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
        path: 'cuenta',
        canActivate: [authGuard, rolGuard('CLIENTE')],
        loadComponent: () =>
          import('../features/clientes/components/cuenta-cliente/cuenta-cliente').then(
            (m) => m.CuentaCliente,
          ),
        children: [
          {
            path: '',
            title: 'Mis compras · Concesionaria',
            loadComponent: () =>
              import('../features/ventas/components/mis-compras/mis-compras').then(
                (m) => m.MisCompras,
              ),
          },
          {
            path: 'cotizaciones',
            title: 'Mis cotizaciones · Concesionaria',
            loadComponent: () =>
              import('../features/ventas/components/mis-cotizaciones/mis-cotizaciones').then(
                (m) => m.MisCotizaciones,
              ),
          },
          {
            path: 'reservas',
            title: 'Mis reservas · Concesionaria',
            loadComponent: () =>
              import('../features/ventas/components/mis-reservas/mis-reservas').then(
                (m) => m.MisReservas,
              ),
          },
          {
            path: 'datos',
            title: 'Mis datos · Concesionaria',
            loadComponent: () =>
              import('../features/clientes/components/mi-perfil/mi-perfil').then(
                (m) => m.MiPerfil,
              ),
          },
        ],
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
