/** Tipos de venta-service. Coinciden con los DTOs del backend. */

export type EstadoCotizacion = 'SOLICITADA' | 'RESPONDIDA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';
export type EstadoReserva = 'ACTIVA' | 'VENCIDA' | 'CONVERTIDA' | 'ANULADA';
export type EstadoVenta = 'CONFIRMADA' | 'ANULADA';
export type FormaPago = 'CONTADO' | 'FINANCIADA';

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
  estado: EstadoVenta;
  motivoAnulacion: string | null;
  fechaVenta: string;
  fechaAnulacion: string | null;
}
