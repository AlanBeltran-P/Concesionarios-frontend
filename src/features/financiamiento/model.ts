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

export interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  tasaAnual: number;
  /** Cantidades de cuotas permitidas, ej. [12, 24, 36]. */
  plazos: number[];
  porcentajeAnticipoMinimo: number;
  porcentajeMoraDiaria: number;
  activo: boolean;
}

/** anticipo = todo lo que no se financia (efectivo + seña + auto usado). */
export interface SimulacionRequest {
  planId: number;
  precio: number;
  anticipo: number;
  cantidadCuotas: number;
}

export interface CuotaSimulada {
  numero: number;
  capital: number;
  interes: number;
  monto: number;
  saldoRestante: number;
}

export interface Simulacion {
  planId: number;
  plan: string;
  tasaAnual: number;
  precio: number;
  anticipo: number;
  anticipoMinimo: number;
  montoFinanciado: number;
  cantidadCuotas: number;
  valorCuota: number;
  totalIntereses: number;
  totalAPagar: number;
  cuotas: CuotaSimulada[];
}
