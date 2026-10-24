import { hoyISO } from '../../shared/utils/formato';
import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import {
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
