/** Tipos de vehiculo-service. Coinciden con los DTOs del backend. */

export type CondicionVehiculo = 'NUEVO' | 'USADO';
export type EstadoVehiculo = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO';
/** TRADE_IN = recibido como parte de pago en una venta. */
export type OrigenVehiculo = 'COMPRA' | 'TRADE_IN';

export interface Marca {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Modelo {
  id: number;
  nombre: string;
  marcaId: number;
  marcaNombre: string;
  categoriaId: number;
  categoriaNombre: string;
  activo: boolean;
}

export interface ImagenVehiculo {
  id: number;
  /** Ruta relativa al gateway, por ejemplo /api/vehiculos/1/imagenes/2/archivo. */
  url: string;
  nombreArchivo: string;
  orden: number;
  principal: boolean;
}

/** Fila del listado (GET /vehiculos). */
export interface VehiculoResumen {
  id: number;
  marca: string;
  modelo: string;
  categoria: string;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  condicion: CondicionVehiculo;
  estado: EstadoVehiculo;
  imagenPrincipalUrl: string | null;
}

/** Detalle completo (GET /vehiculos/{id}). */
export interface Vehiculo {
  id: number;
  vin: string;
  marcaId: number;
  marca: string;
  modeloId: number;
  modelo: string;
  categoriaId: number;
  categoria: string;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  condicion: CondicionVehiculo;
  estado: EstadoVehiculo;
  origen: OrigenVehiculo;
  descripcion: string | null;
  activo: boolean;
  imagenes: ImagenVehiculo[];
  fechaIngreso: string;
}

/** Alta (POST) y edición (PUT). El estado no va acá: se cambia aparte. */
export interface VehiculoRequest {
  vin: string;
  modeloId: number;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  condicion: CondicionVehiculo;
  descripcion: string | null;
}

export type OrdenVehiculos =
  'fechaIngreso,desc' | 'precio,asc' | 'precio,desc' | 'anio,desc' | 'kilometraje,asc';

/** Filtros del listado. Los vacíos no se mandan. */
export interface FiltroVehiculos {
  texto?: string;
  marcaId?: number;
  condicion?: CondicionVehiculo;
  estado?: EstadoVehiculo;
  page: number;
  size: number;
  sort: OrdenVehiculos;
}
