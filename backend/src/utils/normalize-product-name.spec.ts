import { normalizeProductName } from './normalize-product-name';

describe('normalizeProductName', () => {
  it('normaliza minúsculas + acentos + caracteres', () => {
    expect(normalizeProductName('Abrazadera Nac Alí 9mm')).toBe(
      'abrazadera 9 mm ali',
    );
  });

  it('expande abreviaturas y unidades', () => {
    expect(normalizeProductName('Tornillo AC GALV 1/2" x 2"')).toBe(
      'acero galvanizado tornillo 1/2 pulgadas por 2 pulgadas',
    );
  });

  it('normaliza separador x a por (solo en medidas)', () => {
    expect(normalizeProductName('abrazadera 10x25')).toBe(
      'abrazadera 10 por 25',
    );
  });

  it('normaliza 10-16 x25 como tokens de medida', () => {
    expect(normalizeProductName('ABRAZADERA 9mm 10-16 x25')).toBe(
      'abrazadera 9 mm 10-16 por 25',
    );
  });

  it('elimina stopwords comerciales', () => {
    expect(normalizeProductName('Juego de llaves de tubo x 10')).toBe(
      'llave por 10 tubo',
    );
  });
});


