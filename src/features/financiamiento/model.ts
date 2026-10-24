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

/** VENCIDA la marca el proceso diario. ANULADA: se anuló la venta y no se cobra. */
export type EstadoCuota = 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA' | 'VENCIDA' | 'ANULADA';

export interface Cuota {
  id: number;
  financiamientoId: number;
  clienteId: number;
  clienteNombre: string;
  numero: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  monto: number;
  mora: number;
  montoPagado: number;
  /** Lo que falta pagar, con la mora incluida. */
  saldo: number;
  estado: EstadoCuota;
  fechaPago: string | null;
  diasAtraso: number;
}

/** Estado de cuenta de un financiamiento (RF-32). */
export interface EstadoCuenta {
  financiamiento: FinanciamientoResumen;
  resumen: {
    montoAnticipo: number;
    anticipoPagado: number;
    anticipoPendiente: number;
    cuotasPagadas: number;
    cuotasPendientes: number;
    cuotasVencidas: number;
    totalCuotas: number;
    totalPagadoCuotas: number;
    moraAcumulada: number;
    /** Todo lo que falta pagar (cuotas impagas + mora). */
    saldoPendiente: number;
    deudaVencida: number;
    proximaCuota: Cuota | null;
  };
  cuotas: Cuota[];
  pagos: Pago[];
}

/** Sin cuotaId, un pago de cuota se aplica a la impaga más antigua (las cuotas se pagan en orden). */
export interface RegistrarPago {
  financiamientoId: number;
  tipo: TipoPago;
  cuotaId: number | null;
  monto: number;
  medioPago: MedioPago;
  referencia: string | null;
}

/** Los porcentajes van como número: 45 = 45 %. */
export interface PlanRequest {
  nombre: string;
  descripcion: string | null;
  tasaAnual: number;
  plazos: number[];
  porcentajeAnticipoMinimo: number;
  porcentajeMoraDiaria: number;
}

export interface FiltroFinanciamientos {
  clienteId?: number;
  estado?: EstadoFinanciamiento;
  page: number;
  size: number;
}

export interface FiltroCuotas {
  estado?: EstadoCuota;
  clienteId?: number;
  financiamientoId?: number;
  page: number;
  size: number;
}

/** Resultado de correr a mano el proceso diario de vencimientos y mora. */
export interface ResultadoVencimientos {
  fecha: string;
  cuotasVencidas: number;
  morasActualizadas: number;
  recordatorios: number;
}
