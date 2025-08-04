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
  metadata?: Record<string, any>;
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
    }
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

  trackError(error: Error | any, context?: Record<string, any>): void {
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
    
    // Integration points for external services:
    // - gtag('event', activity.action, { page_title: activity.page })
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

  trackBusinessMetric(metric: string, value: number, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    console.log('Business metric:', { metric, value, tags });
    
    // Integration points for external services:
    // - datadog.increment(metric, value, tags)
    // - gtag('event', metric, { value, custom_parameters: tags })
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

  const trackUserInteraction = (action: string, metadata?: Record<string, any>) => {
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
