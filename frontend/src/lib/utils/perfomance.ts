export function trackPageLoad(pageName: string) {
  if (typeof window === 'undefined') return;

  const navigationTiming = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming;

  const metrics = {
    page: pageName,
    loadTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
    domContentLoaded:
      navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
  };

  console.log('Performance Metrics:', metrics);

  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
  }
}
