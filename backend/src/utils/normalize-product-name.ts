import {
  defaultNormalizeConfig,
  type NormalizeConfig,
} from './normalize-product-name.config';

/**
 * Normaliza un nombre de artículo a una representación canónica estable y comparable.
 *
 * Pipeline (determinístico):
 * 1) minúsculas
 * 2) eliminar acentos/diacríticos + caracteres especiales (deja letras/números/espacios)
 * 3) tokenización + normalización de unidades
 * 4) expansión de abreviaturas (por token)
 * 5) normalización de medidas (ej: "10x25" -> "10 por 25", "1/2" + pulgadas)
 * 6) eliminar stopwords
 * 7) ordenar: material -> tipo -> medidas -> resto
 */
export function normalizeProductName(
  input: string,
  config: NormalizeConfig = defaultNormalizeConfig,
): string {
  if (!input || typeof input !== 'string') return '';

  // 1) minúsculas
  let s = input.toLowerCase();

  // 2) eliminar acentos/diacríticos (unicode NFD)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Normalizar pulgadas explícitas pegadas a números: 1/2" -> "1/2 pulgadas"
  // (se hace antes de remover comillas)
  s = s.replace(
    /(\d+(?:\/\d+)?(?:[.,]\d+)?)\s*(\"|''|″)/g,
    '$1 pulgadas',
  );

  // Normalizar separadores frecuentes a espacio (manteniendo / y - para medidas)
  s = s
    .replace(/[“”‘’"]/g, '')
    .replace(/[(){}\[\],;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Insertar espacios alrededor de "x" cuando es separador de medidas: "10x25" => "10 x 25"
  s = s.replace(/(\d)\s*x\s*(\d)/g, '$1 x $2');
  s = s.replace(/(\d)\s*x\s*([a-z])/g, '$1 x $2');
  s = s.replace(/([a-z])\s*x\s*(\d)/g, '$1 x $2');

  // Tokenización básica (permitimos / y - dentro del token para 10-16 y 1/2)
  const rawTokens = s
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[^a-z0-9\-\/]+/g, '')) // limpiar caracteres raros
    .filter(Boolean);

  // 3) normalización de unidades + 4) abreviaturas
  const tokens: string[] = [];
  for (const t0 of rawTokens) {
    let t = t0;

    // unidades
    for (const rule of config.units) {
      if (rule.match.test(t)) {
        t = rule.replace;
        break;
      }
    }

    // abreviaturas (por token exacto)
    if (config.abbreviations[t]) {
      t = config.abbreviations[t];
    }

    tokens.push(t);
  }

  // 5) normalización de medidas: "x" => "por" SOLO si está entre valores
  // Ej: ["10","x","25"] => ["10","por","25"]
  const normalizedTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'x') {
      const prev = normalizedTokens[normalizedTokens.length - 1];
      const next = tokens[i + 1];
      const prevIsVal = !!prev && /[0-9]/.test(prev);
      const nextIsVal = !!next && /[0-9]/.test(next);
      // Permitimos también "tubo x 10" (texto + número) para mantener consistencia
      if ((prevIsVal && nextIsVal) || (!!prev && nextIsVal)) {
        normalizedTokens.push('por');
      }
      continue;
    }
    normalizedTokens.push(t);
  }

  // Normalizar patrones "10mm" => "10 mm"
  const exploded: string[] = [];
  for (const t of normalizedTokens) {
    const m = t.match(/^(\d+(?:[.,]\d+)?)(mm|cm|m|pulgadas)$/);
    if (m) {
      exploded.push(m[1].replace(',', '.'));
      exploded.push(m[2]);
    } else {
      exploded.push(t.replace(',', '.'));
    }
  }

  // 6) singularizar tipos comunes (llaves -> llave) si existe el singular en el diccionario
  const singularized = exploded.map((t) => {
    if (t.endsWith('s')) {
      const singular = t.slice(0, -1);
      if (config.productTypes.has(singular)) return singular;
    }
    return t;
  });

  // 6) eliminar stopwords
  const filtered = singularized.filter((t) => t && !config.stopwords.has(t));

  // Heurística: si hay fracciones tipo 1/2 y NO hay unidad, asumir pulgadas
  const hasUnit = filtered.some((t) => t === 'mm' || t === 'cm' || t === 'm' || t === 'pulgadas');
  const hasFraction = filtered.some((t) => /^\d+\/\d+$/.test(t));
  const withImplicitInches = [...filtered];
  if (hasFraction && !hasUnit) {
    withImplicitInches.push('pulgadas');
  }

  // 7) ordenar: material -> tipo -> medidas -> resto
  const materials: string[] = [];
  const types: string[] = [];
  const measures: string[] = [];
  const rest: string[] = [];

  const isMeasureToken = (t: string) =>
    t === 'mm' ||
    t === 'cm' ||
    t === 'm' ||
    t === 'pulgadas' ||
    /^[0-9]+(?:\.[0-9]+)?$/.test(t) ||
    /^\d+\/\d+$/.test(t) ||
    /^\d+\-\d+$/.test(t) ||
    t === 'por';

  for (const t of withImplicitInches) {
    if (config.materials.has(t)) {
      materials.push(t);
    } else if (config.productTypes.has(t)) {
      types.push(t);
    } else if (isMeasureToken(t)) {
      measures.push(t);
    } else {
      rest.push(t);
    }
  }

  // Determinismo: materiales/tipos/rest ordenados alfabéticamente (medidas mantienen orden original)
  materials.sort();
  types.sort();
  rest.sort();

  const out = [...materials, ...types, ...measures, ...rest]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}


