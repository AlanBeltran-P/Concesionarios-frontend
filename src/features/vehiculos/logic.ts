import { CondicionVehiculo, EstadoVehiculo, OrdenVehiculos } from './model';

export const ETIQUETA_ESTADO: Record<EstadoVehiculo, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
};

export const ETIQUETA_CONDICION: Record<CondicionVehiculo, string> = {
  NUEVO: '0 km',
  USADO: 'Usado',
};

export const OPCIONES_ORDEN: { valor: OrdenVehiculos; texto: string }[] = [
  { valor: 'fechaIngreso,desc', texto: 'Más recientes' },
  { valor: 'precio,asc', texto: 'Menor precio' },
  { valor: 'precio,desc', texto: 'Mayor precio' },
  { valor: 'anio,desc', texto: 'Más nuevos' },
  { valor: 'kilometraje,asc', texto: 'Menos kilómetros' },
];

/** Mismo formato que valida el backend: 17 caracteres, sin I, O ni Q. */
export const PATRON_VIN = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const ANIO_MINIMO = 1950;

/** El backend acepta hasta el año que viene (modelos que salen antes de fin de año). */
export function anioMaximo(hoy = new Date()): number {
  return hoy.getFullYear() + 1;
}

/**
 * A qué estados puede pasar un vehículo (mismas reglas que EstadoVehiculo del backend).
 * Volver a disponible un vendido equivale a anular la venta: solo ADMIN.
 */
export function estadosSiguientes(actual: EstadoVehiculo, esAdmin: boolean): EstadoVehiculo[] {
  switch (actual) {
    case 'DISPONIBLE':
      return ['RESERVADO', 'VENDIDO'];
    case 'RESERVADO':
      return ['DISPONIBLE', 'VENDIDO'];
    case 'VENDIDO':
      return esAdmin ? ['DISPONIBLE'] : [];
  }
}
