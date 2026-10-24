import { Cliente, TipoDocumento } from './model';

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; texto: string }[] = [
  { valor: 'DNI', texto: 'DNI' },
  { valor: 'CUIT', texto: 'CUIT' },
  { valor: 'CUIL', texto: 'CUIL' },
  { valor: 'PASAPORTE', texto: 'Pasaporte' },
];

export const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

/** Mismo formato de teléfono que valida el backend. */
export const PATRON_TELEFONO = /^\+?[0-9 ()-]{6,30}$/;

const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Valida el documento con las mismas reglas que el backend (DocumentoValidator).
 * Devuelve el mensaje de error, o null si está bien. Acepta puntos y guiones.
 */
export function errorDeDocumento(tipo: TipoDocumento, numero: string): string | null {
  const limpio = numero.replace(/[.\-\s]/g, '').toUpperCase();
  switch (tipo) {
    case 'DNI':
      return /^\d{7,8}$/.test(limpio) ? null : 'El DNI tiene que tener 7 u 8 números.';
    case 'CUIT':
    case 'CUIL':
      return /^\d{11}$/.test(limpio) && digitoVerificadorValido(limpio)
        ? null
        : `El ${tipo} no es válido. Revisá los 11 números.`;
    case 'PASAPORTE':
      return /^[A-Z0-9]{6,9}$/.test(limpio) ? null : 'Entre 6 y 9 letras o números.';
  }
}

function digitoVerificadorValido(cuit: string): boolean {
  const suma = PESOS_CUIT.reduce((total, peso, i) => total + Number(cuit[i]) * peso, 0);
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? 0 : resto;
  return esperado !== 10 && esperado === Number(cuit[10]);
}

/** "30123456" → "30.123.456"; "20301234567" → "20-30123456-7". */
export function formatearDocumento(tipo: TipoDocumento | null, numero: string | null): string {
  if (!tipo || !numero) return 'Sin documento';
  if (tipo === 'DNI') return `DNI ${Number(numero).toLocaleString('es-AR')}`;
  if (tipo === 'CUIT' || tipo === 'CUIL') {
    return `${tipo} ${numero.slice(0, 2)}-${numero.slice(2, 10)}-${numero.slice(10)}`;
  }
  return `Pasaporte ${numero}`;
}

export function nombreCompleto(c: Pick<Cliente, 'nombre' | 'apellido'>): string {
  return `${c.apellido}, ${c.nombre}`;
}

/** Qué le falta para poder comprar. */
export function faltantesDelPerfil(c: Cliente): string[] {
  const faltan: string[] = [];
  if (!c.numeroDocumento) faltan.push('documento');
  if (!c.telefono) faltan.push('teléfono');
  if (!c.direccion) faltan.push('dirección');
  return faltan;
}
