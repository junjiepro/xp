import { PerformanceMetric } from "./type";

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static isReporting = false;

  static track<T extends (...args: any[]) => Promise<any>>(fn: T): T;
  static track(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ): TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;
  static track(...args: any[]) {
    if (args.length === 1) {
      return PerformanceMonitor.trackFunction(args[0]);
    }
    return PerformanceMonitor.trackMethod(args[0], args[1], args[2]);
  }

  // 方法装饰器版本（用于类方法）
  static trackMethod(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        PerformanceMonitor.recordMetric(
          propertyKey,
          "success",
          performance.now() - start
        );
        return result;
      } catch (error) {
        PerformanceMonitor.recordMetric(
          propertyKey,
          "error",
          performance.now() - start,
          error
        );
        throw error;
      }
    };

    return descriptor;
  }

  // 函数装饰器版本（用于独立函数）
  static trackFunction<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return async function (this: any, ...args: Parameters<T>) {
      const start = performance.now();
      try {
        const result = await fn.apply(this, args);
        PerformanceMonitor.recordMetric(
          fn.name || "anonymous",
          "success",
          performance.now() - start
        );
        return result;
      } catch (error) {
        PerformanceMonitor.recordMetric(
          fn.name || "anonymous",
          "error",
          performance.now() - start,
          error
        );
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
