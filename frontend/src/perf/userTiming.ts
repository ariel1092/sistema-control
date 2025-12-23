import { useEffect } from 'react';

type UserFlow = {
  name: string;
  duration: number;
  route: string;
  timestamp: number;
};

declare global {
  interface Window {
    __userFlows?: UserFlow[];
    __userMeasures?: UserFlow[];
  }
}

const warnIfSlow = (flow: UserFlow) => {
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
  if (!isDev) return;
  if (flow.duration <= 1000) return;
  console.warn(
    `⚠️ Flujo lento: ${flow.name} ${flow.duration.toFixed(1)}ms (ruta=${flow.route})`,
  );
};

const getRoute = () => (typeof window !== 'undefined' ? window.location.pathname : '');

export const startFlow = (name: string) => {
  if (typeof performance === 'undefined' || !performance.mark) return;
  performance.mark(`${name}:start`);
};

export const endFlow = (name: string) => {
  if (typeof performance === 'undefined' || !performance.mark || !performance.measure) return;
  const startMark = `${name}:start`;
  const endMark = `${name}:end`;
  performance.mark(endMark);
  performance.measure(name, startMark, endMark);

  const entries = performance.getEntriesByName(name, 'measure');
  const entry = entries[entries.length - 1];
  if (!entry) return;

  const flow: UserFlow = {
    name,
    duration: entry.duration,
    route: getRoute(),
    timestamp: performance.timeOrigin + entry.startTime,
  };

  if (!window.__userFlows) window.__userFlows = [];
  window.__userFlows.push(flow);

  warnIfSlow(flow);
};

export const mark = (name: string) => {
  if (typeof performance === 'undefined' || !performance.mark) return;
  performance.mark(name);
};

export const measure = (name: string, startMark: string, endMark: string) => {
  if (typeof performance === 'undefined' || !performance.measure) return;
  try {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, 'measure');
    const entry = entries[entries.length - 1];
    if (!entry) return;
    const m: UserFlow = {
      name,
      duration: entry.duration,
      route: getRoute(),
      timestamp: performance.timeOrigin + entry.startTime,
    };
    if (!window.__userMeasures) window.__userMeasures = [];
    window.__userMeasures.push(m);
  } catch {
    // si faltan marks, no romper
  }
};

// Hook para limpiar medidas viejas (opcional) y asegurar que userTiming está habilitado
export const useUserTiming = () => {
  useEffect(() => {
    if (typeof performance === 'undefined') return;
    // No hacemos nada extra; se deja listo para futuros usos globales si se requiere.
  }, []);
};

