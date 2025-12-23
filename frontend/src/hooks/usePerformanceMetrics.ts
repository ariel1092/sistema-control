import { useEffect } from 'react';

type NavigationMetrics = {
  requestStart: number;
  responseStart: number;
  domContentLoadedEventStart: number;
  ttfb: number;
};

export const usePerformanceMetrics = (pageLabel = 'page'): void => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const entries = performance.getEntriesByType('navigation') as
      | PerformanceNavigationTiming[]
      | undefined;

    const nav =
      (entries && entries[0]) ||
      (performance.timing as PerformanceNavigationTiming | undefined);

    if (!nav) return;

    const requestStart = nav.requestStart;
    const responseStart = nav.responseStart;
    const domContentLoadedEventStart = nav.domContentLoadedEventStart;
    const ttfb = responseStart - requestStart;

    const metrics: NavigationMetrics = {
      requestStart,
      responseStart,
      domContentLoadedEventStart,
      ttfb,
    };

    console.info(
      `[perf][${pageLabel}] TTFB=${metrics.ttfb.toFixed(2)}ms | requestStart=${metrics.requestStart} | responseStart=${metrics.responseStart} | domContentLoaded=${metrics.domContentLoadedEventStart}`,
    );
  }, [pageLabel]);
};

export default usePerformanceMetrics;

