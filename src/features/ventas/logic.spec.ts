import { descuentoMaximo, precioFinal, tasacionUtilizable } from './logic';
import { Tasacion } from './model';

describe('reglas de precio', () => {
  it('el vendedor descuenta hasta el 15 %; el ADMIN no tiene tope', () => {
    expect(descuentoMaximo(30_000_000, false)).toBe(4_500_000);
    expect(descuentoMaximo(30_000_000, true)).toBeNull();
  });

  it('precio final = lista - descuento - auto usado', () => {
    expect(precioFinal(20_000_000, 1_000_000, 6_000_000)).toBe(13_000_000);
  });
});

describe('tasacionUtilizable', () => {
  const t = (estado: Tasacion['estado'], fechaValidez: string | null) =>
    ({ estado, fechaValidez }) as Tasacion;

  it('pendiente o aceptada y sin vencer', () => {
    expect(tasacionUtilizable(t('PENDIENTE', '2026-11-08'), '2026-10-24')).toBe(true);
    expect(tasacionUtilizable(t('ACEPTADA', '2026-10-24'), '2026-10-24')).toBe(true);
    expect(tasacionUtilizable(t('ACEPTADA', '2026-10-23'), '2026-10-24')).toBe(false);
    expect(tasacionUtilizable(t('RECHAZADA', null), '2026-10-24')).toBe(false);
    expect(tasacionUtilizable(t('UTILIZADA', null), '2026-10-24')).toBe(false);
  });
});
