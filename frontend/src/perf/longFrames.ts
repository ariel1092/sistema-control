import { useEffect } from 'react';
import { PerfInteractionEntry } from './eventTiming';

type LongFrameEntry = {
  duration: number;
  startTime: number;
  interactionName?: string;
  route: string;
  classification?: string;
};

declare global {
  interface Window {
    __longFrames?: LongFrameEntry[];
    __perfEvents?: PerfInteractionEntry[];
  }
}

const LONG_FRAME_THRESHOLD = 50;
const CRITICAL_FRAME_THRESHOLD = 100;

const getRoute = () => (typeof window !== 'undefined' ? window.location.pathname : '');

const classifyAttribution = (entry: any): string | undefined => {
  const attributions: any[] = entry?.attribution || entry?.attributions || [];
  if (!Array.isArray(attributions) || attributions.length === 0) return undefined;

  const causes = new Set<string>();

  attributions.forEach((attr) => {
    const name = attr.name || '';
    const type = attr.entryType || '';
    const invoker = attr.invoker || '';
    const nodeName = attr?.nodeName || '';

    if (type === 'script' || invoker === 'setTimeout' || invoker === 'promise') {
      causes.add('js');
    }
    if (name.includes('render') || invoker === 'requestAnimationFrame') {
      causes.add('render');
    }
    if (nodeName) {
      causes.add('layout');
    }
  });

  if (causes.has('js')) return 'js sync pesado';
  if (causes.has('render')) return 'render pesado';
  if (causes.has('layout')) return 'layout/style recalculation';
  return undefined;
};

const findNearestInteraction = (startTime: number): string | undefined => {
  const events = window.__perfEvents || [];
  if (!events.length) return undefined;
  // Buscar la interacción más cercana en los últimos 2s
  let nearest: PerfInteractionEntry | undefined;
  let minDelta = Number.POSITIVE_INFINITY;
  const frameTs = performance.timeOrigin + startTime;
  for (const ev of events) {
    const delta = Math.abs(ev.timestamp - frameTs);
    if (delta < minDelta && delta <= 2000) {
      minDelta = delta;
      nearest = ev;
    }
  }
  return nearest?.name;
};

const logIfSlow = (entry: LongFrameEntry) => {
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
  if (!isDev) return;
  if (entry.duration < CRITICAL_FRAME_THRESHOLD) return;
  const interaction = entry.interactionName || 'sin_interaccion';
  const cause = entry.classification || 'causa desconocida';
  console.warn(
    `⚠️ Long frame ${entry.duration.toFixed(1)}ms durante "${interaction}" | causa probable: ${cause}`,
  );
};

const handleEntries = (list: PerformanceObserverEntryList) => {
  list.getEntries().forEach((entry) => {
    const lf = entry as any;
    const duration = lf.duration as number;
    if (duration < LONG_FRAME_THRESHOLD) return;

    const interactionName = findNearestInteraction(lf.startTime);
    const classification = classifyAttribution(lf);

    const record: LongFrameEntry = {
      duration,
      startTime: lf.startTime,
      interactionName,
      route: getRoute(),
      classification,
    };

    if (!window.__longFrames) window.__longFrames = [];
    window.__longFrames.push(record);

    logIfSlow(record);
  });
};

export const useLongAnimationFrames = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('PerformanceObserver' in window)) return;
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes('long-animation-frame')) return;

    try {
      const observer = new PerformanceObserver(handleEntries);
      observer.observe({ type: 'long-animation-frame', buffered: true });
    } catch (err) {
      console.warn('PerformanceObserver long-animation-frame no disponible', err);
    }
  }, []);
};

