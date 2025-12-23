export type NormalizeConfig = {
  /**
   * Abreviaturas (token -> expansión). Ej: "galv" => "galvanizado"
   * Se aplican por token (no substring), luego de limpiar caracteres y separar tokens.
   */
  abbreviations: Record<string, string>;

  /**
   * Unidades (regex literal token -> unidad canónica).
   * Ej: "in", "inch", "''" => "pulgadas"
   */
  units: Array<{ match: RegExp; replace: string }>;

  /**
   * Palabras irrelevantes comerciales (se eliminan).
   */
  stopwords: Set<string>;

  /**
   * Tokens de materiales para ordenar al inicio.
   */
  materials: Set<string>;

  /**
   * Tokens de “tipo” (familias) para priorizar como núcleo del producto.
   */
  productTypes: Set<string>;
};

export const defaultNormalizeConfig: NormalizeConfig = {
  abbreviations: {
    ac: 'acero',
    galv: 'galvanizado',
    inox: 'inoxidable',
    pulg: 'pulgadas',
    // "x" se trata con regla especial (medidas), no acá
  },

  units: [
    // pulgadas (varias formas)
    { match: /^('{2}|″|in|inch|inches)$/i, replace: 'pulgadas' },
    // mm (varias formas)
    { match: /^(mm|milimetro|milimetros|milímetro|milímetros)$/i, replace: 'mm' },
    // cm
    { match: /^(cm|centimetro|centimetros|centímetro|centímetros)$/i, replace: 'cm' },
    // m
    { match: /^(m|metro|metros)$/i, replace: 'm' },
  ],

  stopwords: new Set([
    'de',
    'del',
    'la',
    'el',
    'los',
    'las',
    'para',
    'con',
    'sin',
    'y',
    'o',
    'un',
    'una',
    'x', // si queda suelta, se elimina (medidas se normalizan antes)
    'art',
    'articulo',
    'artículos',
    'articulos',
    'unidad',
    'unidades',
    'pack',
    'juego',
    'set',
    'tipo',
    'modelo',
    'marca',
    'nac',
    'nacional',
    'import',
    'importado',
  ]),

  materials: new Set([
    'acero',
    'galvanizado',
    'inoxidable',
    'aluminio',
    'bronce',
    'plastico',
    'plástico',
    'pvc',
    'hierro',
  ]),

  productTypes: new Set([
    'abrazadera',
    'tornillo',
    'tuerca',
    'arandela',
    'tarugo',
    'clavo',
    'perno',
    'bulon',
    'bulón',
    'mecha',
    'amoladora',
    'martillo',
    'destornillador',
    'llave',
    'candado',
  ]),
};


