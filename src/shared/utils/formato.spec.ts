import { formatearFecha, formatearKm, formatearPrecio, hoyISO } from './formato';

describe('formato', () => {
  it('una fecha sola no se corre un día por la zona horaria', () => {
    expect(formatearFecha('2026-10-31')).toContain('31');
  });

  it('hoyISO usa la fecha local', () => {
    expect(hoyISO(new Date(2026, 9, 24, 23, 30))).toBe('2026-10-24');
  });

  it('precios y kilómetros con separador de miles', () => {
    expect(formatearPrecio(25000000)).toMatch(/25\.000\.000/);
    expect(formatearKm(15000)).toBe('15.000 km');
  });
});
