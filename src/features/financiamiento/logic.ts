import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import { EstadoCuota, EstadoFinanciamiento, MedioPago, TipoPago } from './model';

export const ESTADO_FINANCIAMIENTO: Record<EstadoFinanciamiento, { texto: string; tono: Tono }> = {
  ACTIVO: { texto: 'Al día', tono: 'exito' },
  EN_MORA: { texto: 'En mora', tono: 'peligro' },
  CANCELADO: { texto: 'Cancelado', tono: 'neutro' },
  ANULADO: { texto: 'Anulado', tono: 'neutro' },
};

export const TIPO_PAGO: Record<TipoPago, string> = {
  ANTICIPO: 'Anticipo',
  CUOTA: 'Cuota',
};

export const MEDIO_PAGO: Record<MedioPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA_DEBITO: 'Tarjeta de débito',
  TARJETA_CREDITO: 'Tarjeta de crédito',
  CHEQUE: 'Cheque',
};

export const ESTADO_CUOTA: Record<EstadoCuota, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Pendiente', tono: 'neutro' },
  PAGADA_PARCIAL: { texto: 'Pago parcial', tono: 'aviso' },
  PAGADA: { texto: 'Pagada', tono: 'exito' },
  VENCIDA: { texto: 'Vencida', tono: 'peligro' },
  ANULADA: { texto: 'Anulada', tono: 'neutro' },
};

/** "60, 12, 24" → [12, 24, 60]. Devuelve null si algún valor no es un número de 1 a 120. */
export function leerPlazos(texto: string): number[] | null {
  const partes = texto
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!partes.length) return null;
  const numeros = partes.map(Number);
  if (numeros.some((n) => !Number.isInteger(n) || n < 1 || n > 120)) return null;
  return [...new Set(numeros)].sort((a, b) => a - b);
}
