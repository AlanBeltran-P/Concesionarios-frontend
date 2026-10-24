/** Tipos de notificacion-service (RF-34 a RF-38). */

export type EstadoNotificacion = 'PENDIENTE' | 'ENVIADA' | 'FALLIDA';

/** Un tipo por cada evento que dispara un email. */
export type TipoNotificacion =
  | 'BIENVENIDA'
  | 'RECUPERACION_PASSWORD'
  | 'COTIZACION_RESPONDIDA'
  | 'RESERVA_CONFIRMADA'
  | 'VENTA_CONFIRMADA'
  | 'CUOTA_POR_VENCER'
  | 'CUOTA_VENCIDA';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  destinatario: string;
  usuarioId: number | null;
  asunto: string;
  /** HTML del email. Solo viene en el detalle. */
  cuerpo: string | null;
  referenciaId: number | null;
  estado: EstadoNotificacion;
  intentos: number;
  ultimoError: string | null;
  fechaCreacion: string;
  fechaEnvio: string | null;
}

export interface FiltroNotificaciones {
  tipo?: TipoNotificacion;
  estado?: EstadoNotificacion;
  destinatario?: string;
  page: number;
  size: number;
}
