import { measureExternal } from './performance.storage';

/**
 * Envuelve una llamada externa (axios/fetch/custom) y acumula duración en la métrica `external`.
 * Uso:
 *   await withExternalTiming(() => axios.get(url));
 */
export const withExternalTiming = async <T>(fn: () => Promise<T> | T): Promise<T> =>
  measureExternal(fn);

