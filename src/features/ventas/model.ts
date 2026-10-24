/** Tipos de venta-service. Coinciden con los DTOs del backend. */

export type EstadoCotizacion = 'SOLICITADA' | 'RESPONDIDA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';
export type EstadoReserva = 'ACTIVA' | 'VENCIDA' | 'CONVERTIDA' | 'ANULADA';
export type EstadoVenta = 'CONFIRMADA' | 'ANULADA';
export type FormaPago = 'CONTADO' | 'FINANCIADA';
export type EstadoComision = 'PENDIENTE' | 'PAGADA' | 'ANULADA';

export interface Cotizacion {
  id: number;
  clienteId: number;
  clienteNombre: string;
  vehiculoId: number;
  vehiculo: string;
  vendedorId: number | null;
  vendedorNombre: string | null;
  estado: EstadoCotizacion;
  precioLista: number;
  descuento: number | null;
  tasacionId: number | null;
  valorTradeIn: number | null;
  precioFinal: number | null;
  mensajeCliente: string | null;
  respuestaVendedor: string | null;
  fechaValidez: string | null;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
}

export interface Reserva {
  id: number;
  clienteId: number;
  clienteNombre: string;
  vehiculoId: number;
  vehiculo: string;
  vendedorId: number;
  cotizacionId: number | null;
  montoAnticipo: number;
  fechaVencimiento: string;
  estado: EstadoReserva;
  motivoAnulacion: string | null;
  fechaAnulacion: string | null;
  fechaReserva: string;
}

export interface Venta {
  id: number;
  numeroComprobante: string;
  clienteId: number;
  clienteNombre: string;
  vehiculoId: number;
  vehiculo: string;
  vendedorId: number;
  vendedorNombre: string;
  cotizacionId: number | null;
  reservaId: number | null;
  tasacionId: number | null;
  vehiculoTradeInId: number | null;
  formaPago: FormaPago;
  precioVehiculo: number;
  descuento: number;
  precioFinal: number;
  valorTradeIn: number | null;
  montoAnticipoReserva: number | null;
  saldoAPagar: number;
  entregaEfectivo: number | null;
  planFinanciamientoId: number | null;
  planNombre: string | null;
  cantidadCuotas: number | null;
  montoFinanciado: number | null;
  valorCuota: number | null;
  /** Solo la ven los empleados. */
  comision: { id: number; porcentaje: number; monto: number; estado: EstadoComision } | null;
  estado: EstadoVenta;
  motivoAnulacion: string | null;
  fechaVenta: string;
  fechaAnulacion: string | null;
}

/** UTILIZADA = se tomó como parte de pago en una venta y el auto ya entró al inventario. */
export type EstadoTasacion = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'UTILIZADA';

/** Tasación del auto usado que el cliente entrega como parte de pago (trade-in). */
export interface Tasacion {
  id: number;
  clienteId: number;
  vendedorId: number;
  vin: string;
  modeloId: number;
  modelo: string;
  anio: number;
  color: string;
  kilometraje: number;
  observaciones: string | null;
  valorTasado: number;
  estado: EstadoTasacion;
  fechaValidez: string | null;
  vehiculoIngresadoId: number | null;
  fechaTasacion: string;
}

export interface TasacionRequest {
  clienteId: number;
  vin: string;
  modeloId: number;
  anio: number;
  color: string;
  kilometraje: number;
  observaciones: string | null;
  valorTasado: number;
  diasValidez: number | null;
}

/** Respuesta del vendedor a una cotización (o alta de una cotización del local, con clienteId y vehiculoId). */
export interface RespuestaCotizacion {
  descuento: number | null;
  tasacionId: number | null;
  respuesta: string;
  diasValidez: number | null;
}

export interface NuevaCotizacion extends RespuestaCotizacion {
  clienteId: number;
  vehiculoId: number;
}

export interface FiltroCotizaciones {
  estado?: EstadoCotizacion;
  clienteId?: number;
  vendedorId?: number;
  /** Las pedidas desde el portal que nadie atendió todavía. */
  sinAsignar?: boolean;
  page: number;
  size: number;
}

export interface FiltroReservas {
  clienteId?: number;
  vehiculoId?: number;
  estado?: EstadoReserva;
  page: number;
  size: number;
}

/** clienteId es obligatorio cuando reserva un empleado. */
export interface NuevaReserva {
  clienteId: number;
  vehiculoId: number;
  montoAnticipo: number;
  cotizacionId: number | null;
  diasVigencia: number | null;
}

export interface FiltroVentas {
  clienteId?: number;
  vendedorId?: number;
  estado?: EstadoVenta;
  /** "2026-10-01" */
  desde?: string;
  hasta?: string;
  page: number;
  size: number;
}

/**
 * Con cotización, el precio, el descuento y el auto usado salen de ella (no se mandan).
 * Si el cliente tiene una reserva activa del vehículo, el backend la usa sola y descuenta la seña.
 */
export interface NuevaVenta {
  clienteId: number;
  vehiculoId: number;
  cotizacionId: number | null;
  tasacionId: number | null;
  descuento: number | null;
  formaPago: FormaPago;
  planFinanciamientoId: number | null;
  cantidadCuotas: number | null;
  montoFinanciado: number | null;
}

export interface Comision {
  id: number;
  ventaId: number;
  numeroComprobante: string;
  vendedorId: number;
  vendedorNombre: string;
  baseCalculo: number;
  porcentaje: number;
  monto: number;
  estado: EstadoComision;
  fechaCalculo: string;
  fechaPago: string | null;
}

export interface ResumenComisiones {
  vendedorId: number | null;
  cantidadVentas: number;
  totalPendiente: number;
  totalPagado: number;
  total: number;
}

export interface FiltroComisiones {
  vendedorId?: number;
  estado?: EstadoComision;
  desde?: string;
  hasta?: string;
  page: number;
  size: number;
}
