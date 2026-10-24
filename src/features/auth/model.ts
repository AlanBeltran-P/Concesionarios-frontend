export type Rol = 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
  fechaCreacion: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Respuesta de /auth/login y /auth/refresh. */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tipo: string;
  /** Segundos de vida del access token. */
  expiraEn: number;
  usuario: Usuario;
}

/** Lo que guardamos en el navegador mientras el usuario está logueado. */
export interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface FiltroUsuarios {
  rol?: Rol;
  activo?: boolean;
  texto?: string;
  page: number;
  size: number;
}

/** El ADMIN da de alta empleados: el rol solo puede ser ADMIN o VENDEDOR. */
export interface NuevoEmpleado {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Exclude<Rol, 'CLIENTE'>;
}
