import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Types pour le monitoring
interface ErrorReport {
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
  userType?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userId?: string;
  context?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private apiEndpoint: string = import.meta.env.VITE_MONITORING_API || '/api/monitoring';
  private userId?: string;
  private userType?: string;
  private sessionId: string = Math.random().toString(36).substring(7);

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private constructor() {
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
  }

  setUser(userId: string, userType: string) {
    this.userId = userId;
    this.userType = userType;
  }

  private setupGlobalErrorHandling() {
    // Gestion des erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        userId: this.userId,
        userType: this.userType,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          sessionId: this.sessionId
        }
      });
    });

    // Gestion des promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        userId: this.userId,
        userType: this.userType,
        severity: 'medium',
        context: {
          reason: event.reason,
          sessionId: this.sessionId
        }
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Monitoring des Core Web Vitals
    if ('web-vital' in window) {
      // FCP (First Contentful Paint)
      this.observePerformanceMetric('first-contentful-paint');
      
      // LCP (Largest Contentful Paint)
      this.observePerformanceMetric('largest-contentful-paint');
      
      // CLS (Cumulative Layout Shift)
      this.observeCLS();
      
      // FID (First Input Delay)
      this.observeFID();
    }

    // Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.reportPerformance({
            name: 'page-load-time',
            value: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: Date.now(),
            url: window.location.href,
            userId: this.userId,
            context: {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              request: navigation.responseStart - navigation.requestStart,
              response: navigation.responseEnd - navigation.responseStart,
              dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
              sessionId: this.sessionId
            }
          });
        }
      }, 0);
    });
  }

  private observePerformanceMetric(entryType: string) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportPerformance({
          name: entryType,
          value: entry.startTime,
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.userId,
          context: {
            sessionId: this.sessionId
          }
        });
      }
    });
    observer.observe({ entryTypes: [entryType] });
  }

  private observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });

    // Rapporter CLS à la fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.reportPerformance({
        name: 'cumulative-layout-shift',
        value: clsValue,
        timestamp: Date.now(),
        url: window.location.href,
        userId: this.userId,
        context: {
          sessionId: this.sessionId
        }
      });
    });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportPerformance({
          name: 'first-input-delay',
          value: (entry as any).processingStart - entry.startTime,
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.userId,
          context: {
            sessionId: this.sessionId
          }
        });
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  async reportError(error: ErrorReport) {
    try {
      // En développement, logger dans la console
      if (import.meta.env.DEV) {
        console.error('🚨 Error Report:', error);
        return;
      }

      // En production, envoyer au service de monitoring
      await fetch(`${this.apiEndpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }

  async reportPerformance(metric: PerformanceMetric) {
    try {
      // En développement, logger dans la console
      if (import.meta.env.DEV) {
        console.info('📊 Performance Metric:', metric);
        return;
      }

      // En production, envoyer au service de monitoring
      await fetch(`${this.apiEndpoint}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (e) {
      console.error('Failed to report performance metric:', e);
    }
  }

  // Méthodes publiques pour un usage manuel
  captureException(error: Error, context?: Record<string, any>, severity: ErrorReport['severity'] = 'medium') {
    this.reportError({
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      userId: this.userId,
      userType: this.userType,
      severity,
      context: {
        ...context,
        sessionId: this.sessionId
      }
    });
  }

  startTransaction(name: string) {
    const startTime = performance.now();
    
    return {
      finish: (context?: Record<string, any>) => {
        const duration = performance.now() - startTime;
        this.reportPerformance({
          name: `transaction-${name}`,
          value: duration,
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.userId,
          context: {
            ...context,
            sessionId: this.sessionId
          }
        });
      }
    };
  }

  // Hook pour tracking des changements de route
  trackPageView(path: string, additionalData?: Record<string, any>) {
    this.reportPerformance({
      name: 'page-view',
      value: Date.now(),
      timestamp: Date.now(),
      url: path,
      userId: this.userId,
      context: {
        ...additionalData,
        sessionId: this.sessionId,
        referrer: document.referrer
      }
    });
  }
}

// Hook React pour intégrer le monitoring
export function useMonitoring() {
  const location = useLocation();
  const monitoring = MonitoringService.getInstance();

  useEffect(() => {
    // Track page views
    monitoring.trackPageView(location.pathname);
  }, [location.pathname]);

  return {
    captureException: monitoring.captureException.bind(monitoring),
    startTransaction: monitoring.startTransaction.bind(monitoring),
    setUser: monitoring.setUser.bind(monitoring),
  };
}

// Export du service pour usage direct
export default MonitoringService;
