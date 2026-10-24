import { Tono } from '../../shared/ui/etiqueta/etiqueta';
import { EstadoNotificacion, TipoNotificacion } from './model';

export const TIPO_NOTIFICACION: Record<TipoNotificacion, string> = {
  BIENVENIDA: 'Bienvenida',
  RECUPERACION_PASSWORD: 'Recuperar contraseña',
  COTIZACION_RESPONDIDA: 'Cotización respondida',
  RESERVA_CONFIRMADA: 'Reserva confirmada',
  VENTA_CONFIRMADA: 'Venta confirmada',
  CUOTA_POR_VENCER: 'Cuota por vencer',
  CUOTA_VENCIDA: 'Cuota vencida',
};

export const ESTADO_NOTIFICACION: Record<EstadoNotificacion, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Pendiente', tono: 'info' },
  ENVIADA: { texto: 'Enviada', tono: 'exito' },
  FALLIDA: { texto: 'Falló', tono: 'peligro' },
};
