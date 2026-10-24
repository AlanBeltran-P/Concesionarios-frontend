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

/** "2026-10-24T13:00:00" o "2026-10-24" → "24 oct 2026" */
export function formatearFecha(iso: string): string {
  // Una fecha sola ("2026-10-31") JavaScript la toma como medianoche UTC: en Argentina sería el 30.
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const fecha = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(iso);
  return FECHA.format(fecha);
}

/** Fecha local en formato "2026-10-24" (toISOString usa UTC y de noche ya da el día siguiente). */
export function hoyISO(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}
