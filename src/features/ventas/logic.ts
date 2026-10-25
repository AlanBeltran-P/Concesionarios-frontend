import { hoyISO } from '../../shared/utils/formato';
import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import {
  Cotizacion,
  EstadoComision,
  EstadoCotizacion,
  EstadoReserva,
  EstadoTasacion,
  EstadoVenta,
  FormaPago,
  Tasacion,
} from './model';

export const ESTADO_COTIZACION: Record<EstadoCotizacion, { texto: string; tono: Tono }> = {
  SOLICITADA: { texto: 'Solicitada', tono: 'info' },
  RESPONDIDA: { texto: 'Respondida', tono: 'aviso' },
  ACEPTADA: { texto: 'Aceptada', tono: 'exito' },
  RECHAZADA: { texto: 'Rechazada', tono: 'peligro' },
  VENCIDA: { texto: 'Vencida', tono: 'neutro' },
};

/** Los mismos estados, contados desde el lado del cliente (portal). */
export const ESTADO_COTIZACION_CLIENTE: Record<EstadoCotizacion, { texto: string; tono: Tono }> = {
  SOLICITADA: { texto: 'Esperando respuesta', tono: 'info' },
  RESPONDIDA: { texto: 'Te respondieron', tono: 'aviso' },
  ACEPTADA: { texto: 'Aceptada', tono: 'exito' },
  RECHAZADA: { texto: 'Rechazada', tono: 'neutro' },
  VENCIDA: { texto: 'Vencida', tono: 'neutro' },
};

/** El cliente puede reservar con el precio cotizado mientras siga vigente. */
export function cotizacionReservable(c: Cotizacion, hoy = hoyISO()): boolean {
  return (
    (c.estado === 'RESPONDIDA' || c.estado === 'ACEPTADA') &&
    !!c.fechaValidez &&
    c.fechaValidez >= hoy
  );
}

export const ESTADO_RESERVA: Record<EstadoReserva, { texto: string; tono: Tono }> = {
  ACTIVA: { texto: 'Activa', tono: 'aviso' },
  VENCIDA: { texto: 'Vencida', tono: 'neutro' },
  CONVERTIDA: { texto: 'Convertida en venta', tono: 'exito' },
  ANULADA: { texto: 'Anulada', tono: 'peligro' },
};

export const ESTADO_VENTA: Record<EstadoVenta, { texto: string; tono: Tono }> = {
  CONFIRMADA: { texto: 'Confirmada', tono: 'exito' },
  ANULADA: { texto: 'Anulada', tono: 'peligro' },
};

export const FORMA_PAGO: Record<FormaPago, string> = {
  CONTADO: 'Contado',
  FINANCIADA: 'Financiada',
};

export const ESTADO_TASACION: Record<EstadoTasacion, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Esperando al cliente', tono: 'info' },
  ACEPTADA: { texto: 'Aceptada', tono: 'exito' },
  RECHAZADA: { texto: 'Rechazada', tono: 'peligro' },
  UTILIZADA: { texto: 'Usada en una venta', tono: 'neutro' },
};

/** Mismo valor que "descuento-maximo-vendedor" del config de venta-service. El ADMIN no tiene tope. */
export const DESCUENTO_MAXIMO_VENDEDOR = 15;
export const DIAS_VALIDEZ_COTIZACION = 7;
export const DIAS_VALIDEZ_TASACION = 15;

/** Descuento máximo en pesos para ese precio, o null si no hay tope (ADMIN). */
export function descuentoMaximo(precio: number, esAdmin: boolean): number | null {
  return esAdmin ? null : Math.round(precio * DESCUENTO_MAXIMO_VENDEDOR) / 100;
}

/** Precio final de una cotización: lista - descuento - auto usado. */
export function precioFinal(precioLista: number, descuento: number, valorTradeIn: number): number {
  return precioLista - descuento - valorTradeIn;
}

/** Una tasación sirve como parte de pago si está pendiente o aceptada y no venció. */
export function tasacionUtilizable(t: Tasacion, hoy = hoyISO()): boolean {
  return (
    (t.estado === 'PENDIENTE' || t.estado === 'ACEPTADA') &&
    (!t.fechaValidez || t.fechaValidez >= hoy)
  );
}

/** Mismos valores que "reserva" en el config de venta-service. */
export const SENA_MINIMA_PORCENTAJE = 5;
export const DIAS_RESERVA = 7;
export const DIAS_RESERVA_MAXIMO = 30;

export function senaMinima(precio: number): number {
  return Math.round(precio * SENA_MINIMA_PORCENTAJE) / 100;
}

export interface CuentaVenta {
  /** Precio de lista menos descuento. */
  precioFinal: number;
  /** Lo que queda por pagar después del auto usado y la seña. */
  saldo: number;
  /** Lo que se paga en efectivo (saldo - financiado). */
  entrega: number;
  /** Máximo que se puede financiar: el saldo, y que el anticipo llegue al mínimo del plan. */
  maximoFinanciable: number;
}

/** Igual que VentaService: el anticipo del plan es todo lo que no se financia (incluye auto usado y seña). */
export function cuentaVenta(datos: {
  precioLista: number;
  descuento: number;
  valorTradeIn: number;
  sena: number;
  financiado: number;
  anticipoMinimoPlan: number | null;
}): CuentaVenta {
  const precioFinal = datos.precioLista - datos.descuento;
  const saldo = precioFinal - datos.valorTradeIn - datos.sena;
  const topePlan =
    datos.anticipoMinimoPlan === null
      ? saldo
      : Math.floor(precioFinal * (100 - datos.anticipoMinimoPlan)) / 100;
  return {
    precioFinal,
    saldo,
    entrega: saldo - datos.financiado,
    maximoFinanciable: Math.max(0, Math.min(saldo, topePlan)),
  };
}

export const ESTADO_COMISION: Record<EstadoComision, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'A pagar', tono: 'aviso' },
  PAGADA: { texto: 'Pagada', tono: 'exito' },
  ANULADA: { texto: 'Anulada', tono: 'neutro' },
};
