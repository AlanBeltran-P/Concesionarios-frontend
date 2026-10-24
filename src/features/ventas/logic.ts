import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import { EstadoCotizacion, EstadoReserva, EstadoVenta, FormaPago } from './model';

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
