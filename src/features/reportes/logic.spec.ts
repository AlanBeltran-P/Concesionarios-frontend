import { topeRedondo } from '../../shared/ui/grafico-columnas/grafico-columnas';
import { completarMeses, nombreMes, periodoDe } from './logic';

describe('periodoDe', () => {
  const hoy = new Date(2026, 9, 24);

  it('este mes, este año y los últimos 12 meses', () => {
    expect(periodoDe('mes', hoy)).toEqual({ desde: '2026-10-01', hasta: '2026-10-24' });
    expect(periodoDe('anio', hoy)).toEqual({ desde: '2026-01-01', hasta: '2026-10-24' });
    expect(periodoDe('12meses', hoy)).toEqual({ desde: '2025-11-01', hasta: '2026-10-24' });
  });
});

describe('completarMeses', () => {
  it('rellena con cero los meses sin ventas y cruza el año', () => {
    const meses = completarMeses(
      '2025-11-01',
      '2026-02-10',
      [{ mes: '2026-01', valor: 5 }],
      (mes) => ({ mes, valor: 0 }),
    );
    expect(meses.map((m) => `${m.mes}:${m.valor}`)).toEqual([
      '2025-11:0',
      '2025-12:0',
      '2026-01:5',
      '2026-02:0',
    ]);
  });

  it('nombre corto del mes', () => {
    expect(nombreMes('2026-10')).toBe('oct 26');
  });
});

describe('topeRedondo', () => {
  it('redondea el máximo del eje a 1, 2 o 5 por potencia de 10', () => {
    expect(topeRedondo(75_000_000)).toBe(100_000_000);
    expect(topeRedondo(18)).toBe(20);
    expect(topeRedondo(4)).toBe(5);
    expect(topeRedondo(0)).toBe(1);
  });
});
