import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';

type PerformanceSection = 'auth' | 'db' | 'logic' | 'external';

type PerformanceStore = {
  auth: number;
  db: number;
  logic: number;
  external: number;
};

const als = new AsyncLocalStorage<PerformanceStore>();

export const runWithPerformanceStore = <T>(fn: () => T): T => {
  return als.run({ auth: 0, db: 0, logic: 0, external: 0 }, fn);
};

export const addTime = (section: PerformanceSection, durationMs: number): void => {
  const store = als.getStore();
  if (!store || Number.isNaN(durationMs)) return;
  store[section] += Math.max(durationMs, 0);
};

export const measureSection = async <T>(
  section: PerformanceSection,
  fn: () => Promise<T> | T,
): Promise<T> => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    addTime(section, performance.now() - start);
  }
};

export const measureLogic = <T>(fn: () => Promise<T> | T) =>
  measureSection('logic', fn);

export const measureExternal = <T>(fn: () => Promise<T> | T) =>
  measureSection('external', fn);

export const getStore = (): PerformanceStore | undefined => als.getStore();

export const resetStore = (): void => {
  const store = als.getStore();
  if (!store) return;
  store.auth = 0;
  store.db = 0;
  store.logic = 0;
  store.external = 0;
};

