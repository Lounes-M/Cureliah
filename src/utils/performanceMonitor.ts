/**
 * Performance Monitor - Surveillance avancée des performances
 * Collecte des métriques Web Vitals et des performances applicatives
 */

import { logger } from '@/services/logger';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Additional metrics
  loadTime: number;
  renderTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  navigationTiming: {
    loadEventEnd: number;
    loadEventStart: number;
    domContentLoadedEventEnd: number;
    domContentLoadedEventStart: number;
  };
}

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private enabled: boolean = true;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupWebVitalsObservers();
    this.collectNavigationTiming();
    this.monitorMemoryUsage();
    this.setupCustomPerformanceMarks();
  }

  private setupWebVitalsObservers(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = lastEntry.startTime;
        logger.debug('LCP measured', { lcp: lastEntry.startTime, component: 'PerformanceMonitor', action: 'web_vitals' });
      });

      if ('PerformanceObserver' in window) {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.fid = fid;
          logger.debug('FID measured', { fid, component: 'PerformanceMonitor', action: 'web_vitals' });
        });
      });

      if ('PerformanceObserver' in window) {
        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
          this.observers.push(fidObserver);
        } catch (e) {
          // first-input may not be supported in all browsers
        }
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      let clsEntries: any[] = [];

      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = clsValue;
        logger.debug('CLS measured', { cls: clsValue, component: 'PerformanceMonitor', action: 'web_vitals' });
      });

      if ('PerformanceObserver' in window) {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            logger.debug('FCP measured', { fcp: entry.startTime, component: 'PerformanceMonitor', action: 'web_vitals' });
          }
        });
      });

      if ('PerformanceObserver' in window) {
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      }

    } catch (error) {
      logger.error('Error setting up Web Vitals observers', error as Error, { component: 'PerformanceMonitor', action: 'observer_setup_error' });
    }
  }

  private collectNavigationTiming(): void {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    // Time to First Byte
    const ttfb = timing.responseStart - navigationStart;
    this.metrics.ttfb = ttfb;

    // Navigation timing
    this.metrics.navigationTiming = {
      loadEventEnd: timing.loadEventEnd - navigationStart,
      loadEventStart: timing.loadEventStart - navigationStart,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd - navigationStart,
      domContentLoadedEventStart: timing.domContentLoadedEventStart - navigationStart,
    };

    // Load and render times
    this.metrics.loadTime = timing.loadEventEnd - navigationStart;
    this.metrics.renderTime = timing.domContentLoadedEventEnd - navigationStart;

    logger.info('Navigation timing collected', {
      ttfb,
      loadTime: this.metrics.loadTime,
      renderTime: this.metrics.renderTime,
      component: 'PerformanceMonitor',
      action: 'navigation_timing'
    });
  }

  private monitorMemoryUsage(): void {
    const performance = window.performance as any;
    if (performance && performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100, // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100, // MB
      };

      logger.debug('Memory usage collected', { ...this.metrics.memoryUsage, component: 'PerformanceMonitor', action: 'memory_usage' });
    }
  }

  private setupCustomPerformanceMarks(): void {
    // Mark key application events
    if (window.performance && window.performance.mark) {
      window.performance.mark('app-start');
      
      // Mark when React has finished hydrating
      if (document.readyState === 'complete') {
        window.performance.mark('app-ready');
      } else {
        window.addEventListener('load', () => {
          window.performance.mark('app-ready');
        });
      }
    }
  }

  public markPerformance(name: string): void {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
      logger.debug('Performance mark', { name, timestamp: Date.now(), component: 'PerformanceMonitor', action: 'custom_mark' });
    }
  }

  public measurePerformance(name: string, startMark: string, endMark?: string): number | null {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name, 'measure')[0];
        const duration = measure ? measure.duration : 0;
        
        logger.debug('Performance measurement', {
          name,
          startMark,
          endMark,
          duration,
          component: 'PerformanceMonitor',
          action: 'custom_measure'
        });
        
        return duration;
      } catch (error) {
        logger.error('Error measuring performance', error as Error, {
          name,
          startMark,
          endMark,
          component: 'PerformanceMonitor',
          action: 'measure_error'
        });
        return null;
      }
    }
    return null;
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getResourceTiming(): PerformanceResourceTiming[] {
    if (window.performance && window.performance.getEntriesByType) {
      return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  }

  public analyzeResourcePerformance(): void {
    const resources = this.getResourceTiming();
    const analysis = {
      totalResources: resources.length,
      slowResources: resources.filter(r => r.duration > 1000),
      largeResources: resources.filter(r => r.transferSize > 100000),
      cachedResources: resources.filter(r => r.transferSize === 0),
    };

    logger.info('Resource performance analysis', { analysis, component: 'PerformanceMonitor', action: 'resource_analysis' });

    // Warn about slow resources
    analysis.slowResources.forEach(resource => {
      logger.warn('Slow resource detected', {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        component: 'PerformanceMonitor',
        action: 'slow_resource'
      });
    });
  }

  public generateReport(): object {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      resourceAnalysis: {
        total: this.getResourceTiming().length,
        slow: this.getResourceTiming().filter(r => r.duration > 1000).length,
        large: this.getResourceTiming().filter(r => r.transferSize > 100000).length,
      },
      recommendations: this.generateRecommendations(),
    };

    logger.info('Performance report generated', { report, component: 'PerformanceMonitor', action: 'report_generated' });
    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('LCP is too high (>2.5s). Consider optimizing largest content element.');
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('FID is too high (>100ms). Consider reducing JavaScript execution time.');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('CLS is too high (>0.1). Consider adding size attributes to images and ads.');
    }

    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('FCP is too high (>1.8s). Consider optimizing critical rendering path.');
    }

    if (metrics.memoryUsage && metrics.memoryUsage.used > metrics.memoryUsage.limit * 0.8) {
      recommendations.push('High memory usage detected. Consider optimizing memory-intensive operations.');
    }

    return recommendations;
  }

  public cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error('Error disconnecting performance observer', error as Error, { component: 'PerformanceMonitor', action: 'cleanup_error' });
      }
    });
    this.observers = [];
  }

  public disable(): void {
    this.enabled = false;
    this.cleanup();
  }

  public enable(): void {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export const markStart = (name: string) => performanceMonitor.markPerformance(`${name}-start`);
export const markEnd = (name: string) => performanceMonitor.markPerformance(`${name}-end`);
export const measure = (name: string) => performanceMonitor.measurePerformance(name, `${name}-start`, `${name}-end`);

// Auto-start monitoring when module is imported
if (typeof window !== 'undefined') {
  // Generate report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.analyzeResourcePerformance();
      performanceMonitor.generateReport();
    }, 1000);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}

export default PerformanceMonitor;
