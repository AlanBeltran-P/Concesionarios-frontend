import { PATRON_VIN, anioMaximo, errorDeImagen, estadosSiguientes } from './logic';

describe('estadosSiguientes', () => {
  it('sigue las reglas del backend', () => {
    expect(estadosSiguientes('DISPONIBLE', false)).toEqual(['RESERVADO', 'VENDIDO']);
    expect(estadosSiguientes('RESERVADO', false)).toEqual(['DISPONIBLE', 'VENDIDO']);
  });

  it('solo el ADMIN puede volver a disponible un vendido', () => {
    expect(estadosSiguientes('VENDIDO', false)).toEqual([]);
    expect(estadosSiguientes('VENDIDO', true)).toEqual(['DISPONIBLE']);
  });
});

describe('validaciones', () => {
  it('VIN: 17 caracteres sin I, O ni Q', () => {
    expect(PATRON_VIN.test('3FADP4BJ7KM123456')).toBe(true);
    expect(PATRON_VIN.test('3fadp4bj7km123456')).toBe(true);
    expect(PATRON_VIN.test('3FADP4BJ7KM12345')).toBe(false);
    expect(PATRON_VIN.test('3FADP4BJ7KM12345O')).toBe(false);
  });

  it('el año máximo es el que viene', () => {
    expect(anioMaximo(new Date(2026, 9, 24))).toBe(2027);
  });
});

describe('errorDeImagen', () => {
  const archivo = (name: string, type: string, mb: number) => ({
    name,
    type,
    size: mb * 1024 * 1024,
  });

  it('acepta JPG, PNG y WEBP de hasta 5 MB', () => {
    expect(errorDeImagen(archivo('a.jpg', 'image/jpeg', 2))).toBeNull();
    expect(errorDeImagen(archivo('a.webp', 'image/webp', 5))).toBeNull();
  });

  it('rechaza otros tipos y los muy pesados', () => {
    expect(errorDeImagen(archivo('a.gif', 'image/gif', 1))).toContain('JPG, PNG o WEBP');
    expect(errorDeImagen(archivo('a.png', 'image/png', 6))).toContain('5 MB');
  });
});
