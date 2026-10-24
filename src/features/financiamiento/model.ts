/** Tipos de financiamiento-service. Coinciden con los DTOs del backend. */

export type EstadoFinanciamiento = 'ACTIVO' | 'EN_MORA' | 'CANCELADO' | 'ANULADO';
export type TipoPago = 'ANTICIPO' | 'CUOTA';
export type MedioPago =
  'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'CHEQUE';

export interface FinanciamientoResumen {
  id: number;
  ventaId: number;
  numeroComprobante: string;
  clienteId: number;
  clienteNombre: string;
  planId: number;
  plan: string;
  montoFinanciado: number;
  tasaAnualAplicada: number;
  cantidadCuotas: number;
  valorCuota: number;
  fechaPrimerVencimiento: string;
  estado: EstadoFinanciamiento;
  fechaCreacion: string;
}

export interface Pago {
  id: number;
  financiamientoId: number | null;
  ventaId: number | null;
  clienteId: number;
  tipo: TipoPago;
  cuotaId: number | null;
  numeroCuota: number | null;
  monto: number;
  montoMora: number | null;
  medioPago: MedioPago;
  referencia: string | null;
  registradoPorId: number | null;
  fechaPago: string;
}
