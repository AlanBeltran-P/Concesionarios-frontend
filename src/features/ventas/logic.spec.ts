import {
  cotizacionReservable,
  cuentaVenta,
  descuentoMaximo,
  precioFinal,
  senaMinima,
  tasacionUtilizable,
} from './logic';
import { Cotizacion, Tasacion } from './model';

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

describe('cuentaVenta', () => {
  it('con seña y financiación: el anticipo mínimo del plan limita lo financiable', () => {
    const c = cuentaVenta({
      precioLista: 30_000_000,
      descuento: 1_000_000,
      valorTradeIn: 0,
      sena: 2_000_000,
      financiado: 20_300_000,
      anticipoMinimoPlan: 30,
    });
    expect(c.precioFinal).toBe(29_000_000);
    expect(c.saldo).toBe(27_000_000);
    expect(c.maximoFinanciable).toBe(20_300_000);
    expect(c.entrega).toBe(6_700_000);
  });

  it('sin plan se puede financiar hasta el saldo', () => {
    const c = cuentaVenta({
      precioLista: 20_000_000,
      descuento: 0,
      valorTradeIn: 15_000_000,
      sena: 0,
      financiado: 0,
      anticipoMinimoPlan: null,
    });
    expect(c.maximoFinanciable).toBe(5_000_000);
  });

  it('seña mínima del 5 %', () => {
    expect(senaMinima(29_000_000)).toBe(1_450_000);
  });
});

describe('cotizacionReservable', () => {
  const base = { estado: 'RESPONDIDA', fechaValidez: '2026-10-30' } as Cotizacion;

  it('respondida o aceptada y vigente: se puede reservar', () => {
    expect(cotizacionReservable(base, '2026-10-30')).toBe(true);
    expect(cotizacionReservable({ ...base, estado: 'ACEPTADA' }, '2026-10-25')).toBe(true);
  });

  it('vencida, sin responder o rechazada: no', () => {
    expect(cotizacionReservable(base, '2026-10-31')).toBe(false);
    expect(cotizacionReservable({ ...base, estado: 'SOLICITADA', fechaValidez: null }, '2026-10-25')).toBe(false);
    expect(cotizacionReservable({ ...base, estado: 'RECHAZADA' }, '2026-10-25')).toBe(false);
  });
});
