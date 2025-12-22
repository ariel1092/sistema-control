/**
 * Parsea una fecha en formato YYYY-MM-DD respetando la zona horaria local,
 * evitando el corrimiento que produce `new Date('YYYY-MM-DD')` (interpreta UTC).
 */
export function parseLocalDateOnly(dateStr: string): Date {
  if (!dateStr) {
    return undefined as unknown as Date;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    // Si trae hora o no cumple el formato, usar el parser nativo.
    return new Date(dateStr);
  }

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr) - 1; // 0-indexed
  const day = Number(dayStr);

  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Convierte una fecha/hora cualquiera al "inicio de día" del calendario local,
 * expresado como Date UTC a las 00:00:00.000 de ese día (clave de negocio).
 *
 * Motivación: evitar que el "día" corra por usar getUTCDate() (en AR UTC-3 se corre a las 21:00).
 */
export function toBusinessDayStartUtc(date: Date): Date {
  if (!date) return undefined as unknown as Date;
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

export function toBusinessDayEndUtc(date: Date): Date {
  if (!date) return undefined as unknown as Date;
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
}


