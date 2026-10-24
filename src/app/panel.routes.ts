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
      path: ':id',
      title: 'Vehículo · Concesionaria',
      loadComponent: () =>
        import('../features/vehiculos/components/ficha-vehiculo/ficha-vehiculo').then(
          (m) => m.FichaVehiculo,
        ),
    },
  ],
};

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
