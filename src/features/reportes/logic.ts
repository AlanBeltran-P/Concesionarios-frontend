import { hoyISO } from '../../shared/utils/formato';
import { Periodo } from './model';

export type AtajoPeriodo = 'mes' | 'anio' | '12meses';

export const ATAJOS_PERIODO: { valor: AtajoPeriodo; texto: string }[] = [
  { valor: 'mes', texto: 'Este mes' },
  { valor: 'anio', texto: 'Este año' },
  { valor: '12meses', texto: 'Últimos 12 meses' },
];

/** Fechas de un atajo, con hoy como fin. */
export function periodoDe(atajo: AtajoPeriodo, hoy = new Date()): Required<Periodo> {
  const hasta = hoyISO(hoy);
  switch (atajo) {
    case 'mes':
      return { desde: hasta.slice(0, 8) + '01', hasta };
    case 'anio':
      return { desde: hasta.slice(0, 5) + '01-01', hasta };
    case '12meses': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
      return { desde: hoyISO(inicio), hasta };
    }
  }
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

/** "2026-10" → "oct 26" */
export function nombreMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1]} ${anio.slice(2)}`;
}

const COMPACTO = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

/** 25000000 → "$ 25 M" (para ejes y tarjetas chicas). */
export function precioCompacto(valor: number): string {
  return `$ ${COMPACTO.format(valor)}`;
}

/** Nombres legibles de los grupos que manda el backend. */
export const NOMBRE_GRUPO: Record<string, string> = {
  CONTADO: 'Contado',
  FINANCIADA: 'Financiada',
  NUEVO: '0 km',
  USADO: 'Usado',
  DISPONIBLE: 'Disponibles',
  RESERVADO: 'Reservados',
  VENDIDO: 'Vendidos',
};

/** Todos los meses entre desde y hasta (inclusive), con 0 en los que no hubo ventas. */
export function completarMeses<T extends { mes: string }>(
  desde: string,
  hasta: string,
  datos: T[],
  vacio: (mes: string) => T,
): T[] {
  const porMes = new Map(datos.map((d) => [d.mes, d]));
  const resultado: T[] = [];
  let anio = Number(desde.slice(0, 4));
  let mes = Number(desde.slice(5, 7));
  const fin = hasta.slice(0, 7);
  for (let i = 0; i < 120; i++) {
    const clave = `${anio}-${String(mes).padStart(2, '0')}`;
    resultado.push(porMes.get(clave) ?? vacio(clave));
    if (clave >= fin) break;
    mes++;
    if (mes > 12) {
      mes = 1;
      anio++;
    }
  }
  return resultado;
}
