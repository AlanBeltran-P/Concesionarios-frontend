const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
const NUMERO = new Intl.NumberFormat('es-AR');
const FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

/** 25000000 → "$ 25.000.000" */
export function formatearPrecio(valor: number): string {
  return PESOS.format(valor);
}

/** 15000 → "15.000 km" */
export function formatearKm(valor: number): string {
  return `${NUMERO.format(valor)} km`;
}

/** "2026-10-24T13:00:00" → "24 oct 2026" */
export function formatearFecha(iso: string): string {
  return FECHA.format(new Date(iso));
}
