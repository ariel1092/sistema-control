import { useEffect } from 'react';

type PerfEventType = 'click' | 'pointerdown' | 'keydown' | 'submit';

export type PerfInteractionEntry = {
  name: string;
  type: PerfEventType;
  inputDelay: number;
  processingTime: number;
  presentationDelay: number;
  totalDuration: number;
  route: string;
  timestamp: number;
};

type PerfTag = { name: string; ts: number };

declare global {
  interface Window {
    __perfEvents?: PerfInteractionEntry[];
    __perfTags?: PerfTag[];
  }
}

const OBSERVED_TYPES = new Set<PerfEventType>([
  'click',
  'pointerdown',
  'keydown',
  'submit',
]);

let initialized = false;

const getRoute = () => (typeof window !== 'undefined' ? window.location.pathname : '');

const pushEvent = (entry: PerfInteractionEntry) => {
  if (!window.__perfEvents) window.__perfEvents = [];
  window.__perfEvents.push(entry);
};

const pushTag = (name: string) => {
  if (!window.__perfTags) window.__perfTags = [];
  window.__perfTags.push({ name, ts: performance.now() });
};

const consumeTag = (): string | undefined => {
  if (!window.__perfTags || window.__perfTags.length === 0) return undefined;
  const now = performance.now();
  // Expirar tags viejos (>1.5s)
  while (window.__perfTags.length && now - window.__perfTags[0].ts > 1500) {
    window.__perfTags.shift();
  }
  return window.__perfTags.shift()?.name;
};

const toPerfEntry = (entry: PerformanceEventTiming): PerfInteractionEntry | null => {
  if (!OBSERVED_TYPES.has(entry.name as PerfEventType)) return null;

  const inputDelay = Math.max(0, entry.processingStart - entry.startTime);
  const processingEnd =
    typeof (entry as any).processingEnd === 'number'
      ? (entry as any).processingEnd
      : entry.processingStart + entry.duration;
  const processingTime = Math.max(0, processingEnd - entry.processingStart);
  const presentationDelay = Math.max(
    0,
    entry.duration - inputDelay - processingTime,
  );

  const taggedName = consumeTag();

  return {
    name:
      taggedName ||
      (entry.target && (entry.target as Element).id) ||
      entry.name,
    type: entry.name as PerfEventType,
    inputDelay,
    processingTime,
    presentationDelay,
    totalDuration: entry.duration,
    route: getRoute(),
    timestamp: performance.timeOrigin + entry.startTime,
  };
};

const logIfSlow = (e: PerfInteractionEntry) => {
  if (process.env.NODE_ENV !== 'development') return;
  if (e.totalDuration <= 200) return;
  console.warn(
    `⚠️ INP crítico en "${e.name}" (${e.totalDuration.toFixed(
      1,
    )}ms) | inputDelay=${e.inputDelay.toFixed(
      1,
    )}ms | processing=${e.processingTime.toFixed(
      1,
    )}ms | presentation=${e.presentationDelay.toFixed(1)}ms | route=${
      e.route
    }`,
  );
};

const processEntries = (list: PerformanceObserverEntryList) => {
  list.getEntries().forEach((entry) => {
    const perfEntry = toPerfEntry(entry as PerformanceEventTiming);
    if (!perfEntry) return;
    pushEvent(perfEntry);
    logIfSlow(perfEntry);
  });
};

const initObserver = () => {
  if (initialized) return;
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const supported = PerformanceObserver.supportedEntryTypes || [];
  const types: string[] = [];
  if (supported.includes('event')) types.push('event');
  if (supported.includes('first-input')) types.push('first-input');
  if (types.length === 0) return;

  try {
    const observer = new PerformanceObserver(processEntries);
    observer.observe({
      type: types[0] as any,
      buffered: true,
    });
    // En algunos navegadores es necesario registrar ambos tipos
    if (types.length > 1) {
      observer.observe({ type: types[1] as any, buffered: true });
    }
    initialized = true;
  } catch (err) {
    console.warn('PerformanceObserver (event) no disponible', err);
  }
};

export const useInitEventTiming = () => {
  useEffect(() => {
    initObserver();
  }, []);
};

export const tagInteraction = (name: string) => {
  if (typeof window === 'undefined' || !window.performance) return;
  pushTag(name);
};

export const withInteractionTracking = <Args extends any[], R>(
  name: string,
  fn: (...args: Args) => R,
) => {
  return (...args: Args): R => {
    tagInteraction(name);
    return fn(...args);
  };
};

