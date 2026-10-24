import { FinanciamientoResumen, Pago } from '../financiamiento/model';
import { Cotizacion, Reserva, Venta } from '../ventas/model';

/** Tipos de cliente-service. Coinciden con los DTOs del backend. */

export type TipoDocumento = 'DNI' | 'CUIT' | 'CUIL' | 'PASAPORTE';
/** PORTAL = se registró solo; LOCAL = lo cargó un empleado. */
export type OrigenCliente = 'PORTAL' | 'LOCAL';

export interface Direccion {
  calle: string;
  numero: string;
  pisoDepto: string | null;
  ciudad: string;
  provincia: string;
  codigoPostal: string | null;
}

export interface Cliente {
  id: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  /** Puede faltar en los que se registraron en el portal y no completaron el perfil. */
  tipoDocumento: TipoDocumento | null;
  numeroDocumento: string | null;
  email: string | null;
  telefono: string | null;
  direccion: Direccion | null;
  fechaNacimiento: string | null;
  origen: OrigenCliente;
  /** Puede entrar al portal. Su email solo lo cambia él. */
  tieneCuenta: boolean;
  /** Documento, teléfono y dirección cargados: los necesita para comprar. */
  perfilCompleto: boolean;
  fechaCreacion: string;
}

/** Alta y edición desde el panel. Documento obligatorio y al menos un email o teléfono. */
export interface ClienteRequest {
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  email: string | null;
  telefono: string | null;
  direccion: Direccion | null;
  fechaNacimiento: string | null;
}

export interface FiltroClientes {
  texto?: string;
  origen?: OrigenCliente;
  page: number;
  size: number;
}

/** Todo lo que el cliente hizo con la concesionaria (RF-17). */
export interface HistorialCliente {
  cliente: Cliente;
  cotizaciones: Cotizacion[];
  reservas: Reserva[];
  compras: Venta[];
  financiamientos: FinanciamientoResumen[];
  pagos: Pago[];
  /** Secciones que no se pudieron cargar porque otro servicio no respondió. */
  avisos: string[];
}
