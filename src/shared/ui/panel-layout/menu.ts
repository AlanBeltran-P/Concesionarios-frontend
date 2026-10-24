import { Rol } from '../../../features/auth/model';
import { NombreIcono } from '../icono/icono';

export interface ItemMenu {
  /** Ruta dentro de /panel. */
  ruta: string;
  texto: string;
  icono: NombreIcono;
  /** Roles que pueden entrar. Son los mismos que pide el backend en cada servicio. */
  roles: Rol[];
}

export interface SeccionMenu {
  titulo: string;
  items: ItemMenu[];
}

const EMPLEADOS: Rol[] = ['ADMIN', 'VENDEDOR'];
const SOLO_ADMIN: Rol[] = ['ADMIN'];

/** Menú lateral del panel, igual al del Figma. Las rutas del panel se arman a partir de esta lista. */
export const MENU_PANEL: SeccionMenu[] = [
  {
    titulo: 'General',
    items: [
      { ruta: 'dashboard', texto: 'Dashboard', icono: 'dashboard', roles: SOLO_ADMIN },
      { ruta: 'reportes', texto: 'Reportes', icono: 'reportes', roles: SOLO_ADMIN },
    ],
  },
  {
    titulo: 'Gestión',
    items: [
      { ruta: 'vehiculos', texto: 'Vehículos', icono: 'auto', roles: EMPLEADOS },
      { ruta: 'clientes', texto: 'Clientes', icono: 'usuarios', roles: EMPLEADOS },
      { ruta: 'cotizaciones', texto: 'Cotizaciones', icono: 'documento', roles: EMPLEADOS },
      { ruta: 'ventas', texto: 'Ventas', icono: 'recibo', roles: EMPLEADOS },
      { ruta: 'financiamiento', texto: 'Financiamiento', icono: 'tarjeta', roles: EMPLEADOS },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { ruta: 'notificaciones', texto: 'Notificaciones', icono: 'campana', roles: SOLO_ADMIN },
      { ruta: 'usuarios', texto: 'Usuarios', icono: 'escudo', roles: SOLO_ADMIN },
    ],
  },
];

/** El menú con solo lo que puede ver ese rol. Las secciones que quedan vacías no se muestran. */
export function menuParaRol(rol: Rol | undefined): SeccionMenu[] {
  if (!rol) return [];
  return MENU_PANEL.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(rol)),
  })).filter((s) => s.items.length > 0);
}

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CLIENTE: 'Cliente',
};
