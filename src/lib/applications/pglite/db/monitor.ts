import { PerformanceMetric } from "./type";

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static isReporting = false;

  static track<T extends (...args: any[]) => any>(fn: T): T {
    return async function (...args: Parameters<T>) {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        PerformanceMonitor.recordMetric(fn.name, "success", duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        PerformanceMonitor.recordMetric(fn.name, "error", duration, error);
        throw error;
      }
    } as T;
  }

  private static recordMetric(
    operation: string,
    status: "success" | "error",
    duration: number,
    error?: unknown
  ) {
    this.metrics.push({
      operation,
      status,
      duration,
      timestamp: new Date(),
      error: error?.toString(),
    });

    if (!this.isReporting && this.metrics.length >= 100) {
      this.reportMetrics();
    }
  }

  static async reportMetrics() {
    this.isReporting = true;
    const batch = this.metrics.splice(0, 100);

    try {
      // await navigator.sendBeacon('/api/metrics', JSON.stringify(batch));
    } catch (error) {
      console.error("指标上报失败:", error);
      this.metrics.unshift(...batch);
    }

    this.isReporting = false;
  }
}
