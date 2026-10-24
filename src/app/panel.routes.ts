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

/**
 * Rutas dentro de /panel, una por ítem del menú y con los mismos roles.
 * Por ahora todas muestran la página provisoria; cada feature va a reemplazar la suya.
 */
export const PANEL_ROUTES: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioDelPanel], children: [] },
  ...MENU_PANEL.flatMap((seccion) => seccion.items).map((item) => ({
    path: item.ruta,
    title: `${item.texto} · Concesionaria`,
    canActivate: [rolGuard(...item.roles)],
    data: { titulo: item.texto },
    loadComponent: () =>
      import('../shared/ui/en-construccion/en-construccion').then((m) => m.EnConstruccion),
  })),
];
