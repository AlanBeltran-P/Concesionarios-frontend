import { destinoDespuesDelLogin, errorDePassword } from './logic';

describe('errorDePassword', () => {
  it('pide 8 a 72 caracteres con letras y números', () => {
    expect(errorDePassword('Clave123')).toBeNull();
    expect(errorDePassword('Clave12')).not.toBeNull();
    expect(errorDePassword('abcdefgh')).not.toBeNull();
    expect(errorDePassword('12345678')).not.toBeNull();
    expect(errorDePassword('a1'.repeat(37))).not.toBeNull();
  });
});

describe('destinoDespuesDelLogin', () => {
  it('solo acepta rutas internas', () => {
    expect(destinoDespuesDelLogin('/panel/ventas')).toBe('/panel/ventas');
    expect(destinoDespuesDelLogin('//otro-sitio.com')).toBe('/');
    expect(destinoDespuesDelLogin('https://otro-sitio.com')).toBe('/');
    expect(destinoDespuesDelLogin(undefined)).toBe('/');
    expect(destinoDespuesDelLogin(undefined, 'VENDEDOR')).toBe('/panel');
    expect(destinoDespuesDelLogin(undefined, 'CLIENTE')).toBe('/');
  });
});
