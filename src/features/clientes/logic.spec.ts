import { errorDeDocumento, faltantesDelPerfil, formatearDocumento } from './logic';
import { Cliente } from './model';

describe('errorDeDocumento', () => {
  it('DNI: 7 u 8 números, con o sin puntos', () => {
    expect(errorDeDocumento('DNI', '30.123.456')).toBeNull();
    expect(errorDeDocumento('DNI', '1234567')).toBeNull();
    expect(errorDeDocumento('DNI', '123')).not.toBeNull();
  });

  it('CUIT y CUIL: 11 números con dígito verificador', () => {
    expect(errorDeDocumento('CUIT', '20-12345678-6')).toBeNull();
    expect(errorDeDocumento('CUIL', '20123456786')).toBeNull();
    expect(errorDeDocumento('CUIT', '20-12345678-5')).not.toBeNull();
    expect(errorDeDocumento('CUIT', '2012345678')).not.toBeNull();
  });

  it('pasaporte: 6 a 9 letras o números', () => {
    expect(errorDeDocumento('PASAPORTE', 'aaa123456')).toBeNull();
    expect(errorDeDocumento('PASAPORTE', 'AB1')).not.toBeNull();
  });
});

describe('formatearDocumento', () => {
  it('formatea según el tipo', () => {
    expect(formatearDocumento('CUIT', '20123456786')).toBe('CUIT 20-12345678-6');
    expect(formatearDocumento(null, null)).toBe('Sin documento');
  });
});

describe('faltantesDelPerfil', () => {
  it('lista lo que le falta para comprar', () => {
    const c = { numeroDocumento: '1', telefono: null, direccion: null } as Cliente;
    expect(faltantesDelPerfil(c)).toEqual(['teléfono', 'dirección']);
  });
});
