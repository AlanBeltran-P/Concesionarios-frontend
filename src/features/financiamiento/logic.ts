import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import { EstadoFinanciamiento, MedioPago, TipoPago } from './model';

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
