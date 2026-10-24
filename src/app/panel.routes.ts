import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { rolGuard } from '../features/auth/logic';
import { AuthService } from '../features/auth/services/auth.service';
import { MENU_PANEL } from '../shared/ui/panel-layout/menu';

/**
 * El ADMIN arranca en el dashboard; el vendedor, que no ve reportes, en vehículos.
 * Va como guard y no como redirectTo porque los redirect corren antes que el authGuard:
 * sin sesión, el login recibiría ?redirect=/panel/vehiculos aunque después entre un ADMIN.
 */
const inicioDelPanel: CanActivateFn = () =>
  inject(Router).createUrlTree([
    inject(AuthService).tieneRol('ADMIN') ? '/panel/dashboard' : '/panel/vehiculos',
  ]);

/** Pantallas de cada sección que ya está hecha. Las que no figuran acá muestran la página provisoria. */
const SECCIONES: Record<string, Routes> = {
  vehiculos: [
    {
      path: '',
      title: 'Vehículos · Concesionaria',
      loadComponent: () =>
        import('../features/vehiculos/components/listado-vehiculos/listado-vehiculos').then(
          (m) => m.ListadoVehiculos,
        ),
    },
    {
      path: 'nuevo',
      title: 'Nuevo vehículo · Concesionaria',
      loadComponent: () =>
        import('../features/vehiculos/components/ficha-vehiculo/ficha-vehiculo').then(
          (m) => m.FichaVehiculo,
        ),
    },
    {
      path: 'catalogo',
      title: 'Marcas, modelos y categorías · Concesionaria',
      canActivate: [rolGuard('ADMIN')],
      loadComponent: () =>
        import('../features/vehiculos/components/catalogo-vehiculos/catalogo-vehiculos').then(
          (m) => m.CatalogoVehiculos,
        ),
    },
    {
      path: ':id',
      title: 'Vehículo · Concesionaria',
      loadComponent: () =>
        import('../features/vehiculos/components/ficha-vehiculo/ficha-vehiculo').then(
          (m) => m.FichaVehiculo,
        ),
    },
  ],
};

SECCIONES['clientes'] = [
  {
    path: '',
    title: 'Clientes · Concesionaria',
    loadComponent: () =>
      import('../features/clientes/components/listado-clientes/listado-clientes').then(
        (m) => m.ListadoClientes,
      ),
  },
  {
    path: 'nuevo',
    title: 'Nuevo cliente · Concesionaria',
    loadComponent: () =>
      import('../features/clientes/components/ficha-cliente/ficha-cliente').then(
        (m) => m.FichaCliente,
      ),
  },
  {
    path: ':id',
    title: 'Cliente · Concesionaria',
    loadComponent: () =>
      import('../features/clientes/components/ficha-cliente/ficha-cliente').then(
        (m) => m.FichaCliente,
      ),
  },
];

const fichaCotizacion = () =>
  import('../features/ventas/components/ficha-cotizacion/ficha-cotizacion').then(
    (m) => m.FichaCotizacion,
  );
SECCIONES['cotizaciones'] = [
  {
    path: '',
    title: 'Cotizaciones · Concesionaria',
    loadComponent: () =>
      import('../features/ventas/components/listado-cotizaciones/listado-cotizaciones').then(
        (m) => m.ListadoCotizaciones,
      ),
  },
  { path: 'nueva', title: 'Nueva cotización · Concesionaria', loadComponent: fichaCotizacion },
  { path: ':id', title: 'Cotización · Concesionaria', loadComponent: fichaCotizacion },
];

const fichaReserva = () =>
  import('../features/ventas/components/ficha-reserva/ficha-reserva').then((m) => m.FichaReserva);
SECCIONES['ventas'] = [
  {
    path: '',
    title: 'Ventas · Concesionaria',
    loadComponent: () =>
      import('../features/ventas/components/listado-ventas/listado-ventas').then(
        (m) => m.ListadoVentas,
      ),
  },
  {
    path: 'nueva',
    title: 'Registrar venta · Concesionaria',
    loadComponent: () =>
      import('../features/ventas/components/nueva-venta/nueva-venta').then((m) => m.NuevaVenta),
  },
  { path: 'reservas/nueva', title: 'Nueva reserva · Concesionaria', loadComponent: fichaReserva },
  { path: 'reservas/:id', title: 'Reserva · Concesionaria', loadComponent: fichaReserva },
  {
    path: ':id',
    title: 'Venta · Concesionaria',
    loadComponent: () =>
      import('../features/ventas/components/ficha-venta/ficha-venta').then((m) => m.FichaVenta),
  },
];

const estadoCuenta = () =>
  import('../features/financiamiento/components/estado-cuenta/estado-cuenta').then(
    (m) => m.EstadoCuentaComponent,
  );
SECCIONES['financiamiento'] = [
  {
    path: '',
    title: 'Financiamiento · Concesionaria',
    loadComponent: () =>
      import('../features/financiamiento/components/seccion-financiamiento/seccion-financiamiento').then(
        (m) => m.SeccionFinanciamiento,
      ),
  },
  {
    path: 'venta/:ventaId',
    title: 'Estado de cuenta · Concesionaria',
    loadComponent: estadoCuenta,
  },
  { path: ':id', title: 'Estado de cuenta · Concesionaria', loadComponent: estadoCuenta },
];

SECCIONES['comisiones'] = [
  {
    path: '',
    title: 'Comisiones · Concesionaria',
    loadComponent: () =>
      import('../features/ventas/components/listado-comisiones/listado-comisiones').then(
        (m) => m.ListadoComisiones,
      ),
  },
];

SECCIONES['dashboard'] = [
  {
    path: '',
    title: 'Dashboard · Concesionaria',
    loadComponent: () =>
      import('../features/reportes/components/dashboard/dashboard').then(
        (m) => m.DashboardComponent,
      ),
  },
];
SECCIONES['reportes'] = [
  {
    path: '',
    title: 'Reportes · Concesionaria',
    loadComponent: () =>
      import('../features/reportes/components/seccion-reportes/seccion-reportes').then(
        (m) => m.SeccionReportes,
      ),
  },
];

SECCIONES['usuarios'] = [
  {
    path: '',
    title: 'Usuarios · Concesionaria',
    loadComponent: () =>
      import('../features/auth/components/usuarios/usuarios').then((m) => m.Usuarios),
  },
];

SECCIONES['notificaciones'] = [
  {
    path: '',
    title: 'Notificaciones · Concesionaria',
    loadComponent: () =>
      import('../features/notificaciones/components/historial-notificaciones/historial-notificaciones').then(
        (m) => m.HistorialNotificaciones,
      ),
  },
];

/** Rutas dentro de /panel: una por ítem del menú, con los mismos roles. */
export const PANEL_ROUTES: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioDelPanel], children: [] },
  ...MENU_PANEL.flatMap((seccion) => seccion.items).map((item) => ({
    path: item.ruta,
    canActivate: [rolGuard(...item.roles)],
    children: SECCIONES[item.ruta] ?? [
      {
        path: '',
        title: `${item.texto} · Concesionaria`,
        data: { titulo: item.texto },
        loadComponent: () =>
          import('../shared/ui/en-construccion/en-construccion').then((m) => m.EnConstruccion),
      },
    ],
  })),
];
