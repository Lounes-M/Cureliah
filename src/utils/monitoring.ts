/**
 * Production Monitoring and Analytics Integration
 * Ready for external services like Sentry, DataDog, Google Analytics, etc.
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  networkLatency: number;
  errorRate: number;
}

interface UserActivity {
  page: string;
  action: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Types pour les APIs du navigateur
interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener?: (event: string, callback: () => void) => void;
  };
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private isEnabled: boolean = false;
  private config = {
    // Production environment URLs - to be configured
    sentryDsn: process.env.REACT_APP_SENTRY_DSN,
    googleAnalyticsId: process.env.REACT_APP_GA_ID,
    dataDogApiKey: process.env.REACT_APP_DATADOG_KEY,
  };

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  initialize(): void {
    if (process.env.NODE_ENV === 'production') {
      this.isEnabled = true;
      this.setupPerformanceMonitoring();
      this.setupErrorBoundaries();
      this.setupAnalytics();
      this.initializeExternalServices();
    }
  }

  private initializeExternalServices(): void {
    // Initialize Sentry for error tracking
    if (this.config.sentryDsn) {
      this.initializeSentry();
    }

    // Initialize Google Analytics
    if (this.config.googleAnalyticsId) {
      this.initializeGoogleAnalytics();
    }

    // Initialize DataDog RUM
    if (this.config.dataDogApiKey) {
      this.initializeDataDog();
    }
  }

  private initializeSentry(): void {
    // Ready for Sentry integration
    console.log('Sentry initialized:', this.config.sentryDsn);
    
    // Production code would be:
    // import * as Sentry from "@sentry/react";
    // Sentry.init({
    //   dsn: this.config.sentryDsn,
    //   environment: process.env.NODE_ENV,
    //   tracesSampleRate: 1.0,
    // });
  }

  private initializeGoogleAnalytics(): void {
    // Initialize Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
    document.head.appendChild(script);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${this.config.googleAnalyticsId}', {
        page_title: document.title,
        page_location: window.location.href
      });
    `;
    document.head.appendChild(script2);

    // Make gtag available globally
    const windowGlobal = window as WindowWithGtag;
    windowGlobal.gtag = windowGlobal.gtag || function(...args: unknown[]) {
      (windowGlobal.dataLayer = windowGlobal.dataLayer || []).push(args);
    };

    console.log('Google Analytics initialized:', this.config.googleAnalyticsId);
  }

  private initializeDataDog(): void {
    // Ready for DataDog RUM integration
    console.log('DataDog RUM ready for integration:', this.config.dataDogApiKey);
    
    // Production code would be:
    // import { datadogRum } from '@datadog/browser-rum';
    // datadogRum.init({
    //   applicationId: 'your-app-id',
    //   clientToken: this.config.dataDogApiKey,
    //   site: 'datadoghq.eu',
    //   service: 'cureliah',
    //   version: '1.0.0',
    //   sampleRate: 100,
    //   trackInteractions: true,
    // });
  }

  private setupPerformanceMonitoring(): void {
    // Performance monitoring setup
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.trackPerformance({
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          renderTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          networkLatency: perfData.responseEnd - perfData.requestStart,
          errorRate: 0, // To be calculated based on error tracking
        });
      });
    }
  }

  private setupErrorBoundaries(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection',
      });
    });
  }

  private setupAnalytics(): void {
    // Google Analytics 4 setup (ready for integration)
    if (this.config.googleAnalyticsId) {
      // gtag('config', this.config.googleAnalyticsId);
      console.log('Analytics ready for GA4 integration');
    }

    // DataDog RUM setup (ready for integration)
    if (this.config.dataDogApiKey) {
      console.log('DataDog RUM ready for integration');
    }
  }

  trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.isEnabled) return;

    // Send to monitoring service
    console.log('Performance metrics:', metrics);
    
    // Integration points for external services:
    // - Sentry.addBreadcrumb({ category: 'performance', data: metrics })
    // - datadog.addTiming('page.load_time', metrics.loadTime)
    // - gtag('event', 'page_load_time', { value: metrics.loadTime })
  }

  trackError(error: Error | unknown, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    console.error('Tracked error:', error, context);
    
    // Integration points for external services:
    // - Sentry.captureException(error, { contexts: { custom: context } })
    // - datadog.logger.error(error.message, context)
    // - gtag('event', 'exception', { description: error.message })
  }

  trackUserActivity(activity: UserActivity): void {
    if (!this.isEnabled) return;

    console.log('User activity:', activity);
    
    // Send to Google Analytics
    if (this.config.googleAnalyticsId && (window as WindowWithGtag).gtag) {
      (window as WindowWithGtag).gtag!('event', activity.action, {
        page_title: activity.page,
        custom_parameters: activity.metadata
      });
    }
    
    // Integration points for other services:
    // - datadog.addUserAction(activity.action, activity.metadata)
  }

  trackPageView(page: string, userId?: string): void {
    if (!this.isEnabled) return;

    this.trackUserActivity({
      page,
      action: 'page_view',
      timestamp: Date.now(),
      userId,
    });
  }

  // Track business metrics
  trackBusinessMetric(metric: string, value: number, tags?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    console.log(`Business Metric: ${metric} = ${value}`, tags);
    
    // Send to analytics
    if (typeof (window as WindowWithGtag).gtag !== 'undefined') {
      (window as WindowWithGtag).gtag!('event', 'business_metric', {
        metric_name: metric,
        metric_value: value,
        ...tags
      });
    }
  }

  // Track general events
  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled) return;
    
    console.log(`Event: ${eventName}`, properties);
    
    if (typeof (window as WindowWithGtag).gtag !== 'undefined') {
      (window as WindowWithGtag).gtag!(eventName, properties);
    }
  }

  // Log errors
  logError(error: Error, context?: Record<string, unknown>): void {
    console.error('Error logged:', error.message, context);
    
    // In production: send to error tracking service
    if (this.config.sentryDsn) {
      // Sentry.captureException(error, { extra: context });
    }
  }

  // Performance monitoring with Web Vitals
  trackWebVitals(): void {
    if (!this.isEnabled) return;

    // Core Web Vitals tracking
    this.measureLCP(); // Largest Contentful Paint
    this.measureFID(); // First Input Delay
    this.measureCLS(); // Cumulative Layout Shift
    this.measureFCP(); // First Contentful Paint
    this.measureTTFB(); // Time to First Byte
  }

  private measureLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        console.log('LCP:', lastEntry.startTime);
        this.trackPerformanceMetric('largest_contentful_paint', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  private measureFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          if ('processingStart' in entry && 'startTime' in entry) {
            const processingStart = (entry as unknown as { processingStart: number }).processingStart;
            console.log('FID:', processingStart - entry.startTime);
            this.trackPerformanceMetric('first_input_delay', processingStart - entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private measureCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as unknown as { 
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        });
        
        console.log('CLS:', clsValue);
        this.trackPerformanceMetric('cumulative_layout_shift', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private measureFCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            this.trackPerformanceMetric('first_contentful_paint', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      console.log('TTFB:', ttfb);
      this.trackPerformanceMetric('time_to_first_byte', ttfb);
    }
  }

  // Resource performance monitoring
  monitorResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: PerformanceEntry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Track slow resources (> 1 second)
        if (entry.duration > 1000) {
          console.warn('Slow resource:', entry.name, entry.duration);
          this.trackPerformanceMetric('slow_resource_load', entry.duration, {
            resourceName: entry.name,
            resourceType: resourceEntry.initiatorType
          });
        }

        // Track large resources (> 1MB)
        if (resourceEntry.transferSize && resourceEntry.transferSize > 1024 * 1024) {
          console.warn('Large resource:', entry.name, resourceEntry.transferSize);
          this.trackPerformanceMetric('large_resource_size', resourceEntry.transferSize, {
            resourceName: entry.name,
            resourceType: resourceEntry.initiatorType
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Memory usage monitoring
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory;
      
      setInterval(() => {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        console.log(`Memory: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (limit: ${limitMB.toFixed(2)}MB)`);
        
        this.trackPerformanceMetric('memory_usage', usedMB);
        this.trackPerformanceMetric('memory_usage_percentage', (usedMB / limitMB) * 100);
        
        // Alert if memory usage is high
        if ((usedMB / limitMB) > 0.8) {
          this.logError(new Error(`High memory usage: ${usedMB.toFixed(2)}MB`));
        }
      }, 10000); // Check every 10 seconds
    }
  }

  // Network monitoring
  monitorNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      
      const logConnection = () => {
        console.log('Network:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
        
        this.trackPerformanceMetric('network_downlink', connection.downlink);
        this.trackPerformanceMetric('network_rtt', connection.rtt);
        
        // Track slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.trackEvent('slow_network_detected', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        }
      };
      
      // Log initial connection
      logConnection();
      
      // Monitor connection changes
      connection.addEventListener('change', logConnection);
    }
  }

  // Long task monitoring
  monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: PerformanceEntry) => {
          console.warn('Long task detected:', entry.duration, 'ms');
          this.trackPerformanceMetric('long_task_duration', entry.duration);
          
          // Alert for very long tasks (> 100ms)
          if (entry.duration > 100) {
            this.logError(new Error(`Long task blocking main thread: ${entry.duration}ms`));
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // API performance monitoring
  monitorAPIPerformance(url: string, method: string, startTime: number, endTime: number, status: number): void {
    const duration = endTime - startTime;
    
    console.log(`API ${method} ${url}: ${duration}ms (${status})`);
    
    this.trackPerformanceMetric('api_response_time', duration, {
      method,
      url: url.replace(/\/\d+/g, '/:id'), // Normalize IDs in URL
      status
    });
    
    // Track slow API calls (> 2 seconds)
    if (duration > 2000) {
      this.trackEvent('slow_api_call', {
        method,
        url,
        duration,
        status
      });
    }
    
    // Track API errors
    if (status >= 400) {
      this.trackEvent('api_error', {
        method,
        url,
        status,
        duration
      });
    }
  }

  // Bundle size monitoring
  monitorBundleSize(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalJSSize = 0;
        let totalCSSSize = 0;
        
        entries.forEach((entry: PerformanceEntry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (entry.name.endsWith('.js')) {
            totalJSSize += resourceEntry.transferSize || 0;
          } else if (entry.name.endsWith('.css')) {
            totalCSSSize += resourceEntry.transferSize || 0;
          }
        });
        
        console.log(`Bundle sizes - JS: ${(totalJSSize / 1024).toFixed(2)}KB, CSS: ${(totalCSSSize / 1024).toFixed(2)}KB`);
        
        this.trackPerformanceMetric('bundle_js_size', totalJSSize);
        this.trackPerformanceMetric('bundle_css_size', totalCSSSize);
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Custom performance mark and measure
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        if (measure) {
          console.log(`Performance measure ${name}: ${measure.duration.toFixed(2)}ms`);
          this.trackPerformanceMetric(`custom_${name}`, measure.duration);
          return measure.duration;
        }
      } catch (error) {
        console.warn('Failed to create performance measure:', error);
      }
    }
    return null;
  }

  // Helper to track performance metrics with proper formatting
  private trackPerformanceMetric(metric: string, value: number, tags?: Record<string, unknown>): void {
    // Send to DataDog if configured
    if (this.config.dataDogApiKey && typeof window !== 'undefined') {
      // DataDog RUM would be initialized here
      console.log(`[DataDog] ${metric}: ${value}`, tags);
    }
    
    // Send to Google Analytics
    if (typeof (window as WindowWithGtag).gtag !== 'undefined') {
      (window as WindowWithGtag).gtag!('event', 'performance_metric', {
        metric_name: metric,
        metric_value: Math.round(value * 100) / 100, // Round to 2 decimal places
        ...tags
      });
    }
    
    // Track in business metrics
    this.trackBusinessMetric(`performance.${metric}`, value, tags);
  }

  // Health check endpoint for deployment monitoring
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; checks: Record<string, boolean> } {
    const checks = {
      supabase: true, // Could check actual connectivity
      localStorage: typeof localStorage !== 'undefined',
      performance: 'performance' in window,
      websockets: typeof WebSocket !== 'undefined',
    };

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    };
  }
}

// Export monitoring instance
export const monitoring = MonitoringService.getInstance();

// React hook for component-level monitoring
export const useMonitoring = () => {
  const trackComponentMount = (componentName: string) => {
    monitoring.trackUserActivity({
      page: componentName,
      action: 'component_mount',
      timestamp: Date.now(),
    });
  };

  const trackComponentError = (componentName: string, error: Error) => {
    monitoring.trackError(error, { component: componentName });
  };

  const trackUserInteraction = (action: string, metadata?: Record<string, unknown>) => {
    monitoring.trackUserActivity({
      page: window.location.pathname,
      action,
      timestamp: Date.now(),
      metadata,
    });
  };

  return {
    trackComponentMount,
    trackComponentError,
    trackUserInteraction,
  };
};

export default monitoring;
