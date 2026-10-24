import { leerPlazos } from './logic';

describe('leerPlazos', () => {
  it('ordena y saca repetidos', () => {
    expect(leerPlazos('36, 12, 24, 12')).toEqual([12, 24, 36]);
    expect(leerPlazos('6 12')).toEqual([6, 12]);
  });

  it('rechaza valores que no son plazos válidos', () => {
    expect(leerPlazos('')).toBeNull();
    expect(leerPlazos('12, x')).toBeNull();
    expect(leerPlazos('0, 12')).toBeNull();
    expect(leerPlazos('121')).toBeNull();
  });
});
