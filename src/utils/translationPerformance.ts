/**
 * Translation performance monitoring utilities
 * Helps track loading times, cache hits, and bundle sizes
 */

interface TranslationMetrics {
  loadTime: number;
  namespace: string;
  cacheHit: boolean;
  bundleSize?: number;
}

class TranslationPerformanceMonitor {
  private metrics: TranslationMetrics[] = [];
  private loadStartTimes = new Map<string, number>();

  startLoad(namespace: string): void {
    this.loadStartTimes.set(namespace, performance.now());
  }

  endLoad(namespace: string, cacheHit: boolean, bundleSize?: number): void {
    const startTime = this.loadStartTimes.get(namespace);
    if (startTime) {
      const loadTime = performance.now() - startTime;

      this.metrics.push({
        loadTime,
        namespace,
        cacheHit,
        bundleSize,
      });

      this.loadStartTimes.delete(namespace);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Translation loaded: ${namespace} (${loadTime.toFixed(
            2
          )}ms, cache: ${cacheHit})`
        );
      }
    }
  }

  getMetrics(): TranslationMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;

    const totalTime = this.metrics.reduce(
      (sum, metric) => sum + metric.loadTime,
      0
    );
    return totalTime / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;

    const cacheHits = this.metrics.filter((metric) => metric.cacheHit).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  getTotalBundleSize(): number {
    return this.metrics.reduce(
      (sum, metric) => sum + (metric.bundleSize || 0),
      0
    );
  }

  generateReport(): string {
    const avgLoadTime = this.getAverageLoadTime();
    const cacheHitRate = this.getCacheHitRate();
    const totalSize = this.getTotalBundleSize();

    return `
Translation Performance Report:
- Average load time: ${avgLoadTime.toFixed(2)}ms
- Cache hit rate: ${cacheHitRate.toFixed(1)}%
- Total bundle size: ${(totalSize / 1024).toFixed(2)}KB
- Namespaces loaded: ${this.metrics.length}
    `.trim();
  }

  clear(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }
}

export const translationMonitor = new TranslationPerformanceMonitor();

// Development helper to log performance stats
if (process.env.NODE_ENV === "development") {
  // Log performance report every 30 seconds
  setInterval(() => {
    if (translationMonitor.getMetrics().length > 0) {
      console.log(translationMonitor.generateReport());
    }
  }, 30000);
}

/**
 * Hook to monitor translation loading performance
 */
export const useTranslationPerformance = (namespace: string) => {
  const startLoad = () => translationMonitor.startLoad(namespace);
  const endLoad = (cacheHit: boolean, bundleSize?: number) =>
    translationMonitor.endLoad(namespace, cacheHit, bundleSize);

  return { startLoad, endLoad };
};
