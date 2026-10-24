import {
  CondicionVehiculo,
  EstadoVehiculo,
  OrdenVehiculos,
  Vehiculo,
  VehiculoResumen,
} from './model';

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

/** Un vehículo completo en el formato de una fila del listado (para precargar buscadores). */
export function aResumen(v: Vehiculo): VehiculoResumen {
  return {
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    categoria: v.categoria,
    anio: v.anio,
    color: v.color,
    kilometraje: v.kilometraje,
    precio: v.precio,
    condicion: v.condicion,
    estado: v.estado,
    imagenPrincipalUrl: v.imagenes.find((i) => i.principal)?.url ?? null,
  };
}

/** Mismos límites que vehiculo-service (multipart y vehiculos.imagenes). */
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_MB_IMAGEN = 5;
export const MAX_FOTOS = 10;

/** Error para mostrar si el archivo no se puede subir, o null. */
export function errorDeImagen(archivo: Pick<File, 'type' | 'size' | 'name'>): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type))
    return `${archivo.name}: tiene que ser JPG, PNG o WEBP.`;
  if (archivo.size > MAX_MB_IMAGEN * 1024 * 1024)
    return `${archivo.name}: pesa más de ${MAX_MB_IMAGEN} MB.`;
  return null;
}
