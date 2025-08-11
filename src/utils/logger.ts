import { supabase } from '@/integrations/supabase/client.browser';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  stack_trace?: string;
  context?: unknown;
  component?: string;
  action?: string;
}

export class Logger {
  private static instance: Logger;
  private sessionId: string;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  // Fonction utilitaire pour gérer le contexte
  private safeSpread(context?: unknown): Record<string, unknown> {
    return typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
  }

  // Version statique de safeSpread
  private static safeSpread(context?: unknown): Record<string, unknown> {
    return typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
  }

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startBufferFlush();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startBufferFlush() {
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000); // Flush every 30 seconds
  }

  private async flushBuffer() {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      await supabase.from('logs').insert(logsToFlush);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back in buffer if flush failed
      this.buffer.unshift(...logsToFlush);
    }
  }

  private log(level: LogLevel, message: string, context?: unknown, component?: string, action?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      context,
      component,
      action
    };

    // Add user ID if available (async operation will be handled separately)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        entry.user_id = user.id;
      }
    }).catch(() => {
      // User not available, continue without user_id
    });

    this.buffer.push(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  debug(message: string, context?: unknown, component?: string, action?: string) {
    this.log(LogLevel.DEBUG, message, context, component, action);
  }

  info(message: string, context?: unknown, component?: string, action?: string) {
    this.log(LogLevel.INFO, message, context, component, action);
  }

  warn(message: string, context?: unknown, component?: string, action?: string) {
    this.log(LogLevel.WARN, message, context, component, action);
  }

  error(message: string, error?: Error, context?: unknown, component?: string, action?: string) {
    const errorContext = typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      code: error?.name,
      component,
      action,
      context: { ...errorContext, error: error?.message },
    });
  }

  fatal(message: string, error?: Error, context?: unknown, component?: string, action?: string) {
    const fatalContext = typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
    this.log(LogLevel.FATAL, message, { ...fatalContext, error: error?.message, stack: error?.stack }, component, action);
  }

  // Utility methods for common scenarios
  logUserAction(action: string, component: string, context?: unknown) {
    this.info(`User action: ${action}`, context, component, action);
  }

  logAPICall(endpoint: string, method: string, status: number, duration: number, context?: unknown) {
    const message = `API ${method} ${endpoint} - ${status} (${duration}ms)`;
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, message, { ...this.safeSpread(context), endpoint, method, status, duration }, 'API', 'call');
  }

  logComponentMount(component: string, props?: Record<string, unknown>) {
    this.debug(`Component mounted: ${component}`, props, component, 'mount');
  }

  logComponentUnmount(component: string) {
    this.debug(`Component unmounted: ${component}`, undefined, component, 'unmount');
  }

  logPageView(path: string) {
    this.info(`Page view: ${path}`, { path }, 'Navigation', 'page_view');
  }

  logSearch(query: string, results: number, component: string) {
    this.info(`Search performed: "${query}" (${results} results)`, { query, results }, component, 'search');
  }

  logBookingAction(action: string, bookingId: string, context?: unknown) {
    this.info(`Booking ${action}: ${bookingId}`, { ...this.safeSpread(context), bookingId }, 'Booking', action);
  }

  logPaymentAction(action: string, paymentId: string, amount: number, context?: unknown) {
    this.info(`Payment ${action}: ${paymentId} - ${amount}€`, { ...this.safeSpread(context), paymentId, amount }, 'Payment', action);
  }

  // Clean up
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer();
  }
}

export class ErrorHandler {
  private static logger = Logger.getInstance();

  // Version statique de safeSpread
  private static safeSpread(context?: unknown): Record<string, unknown> {
    return typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
  }

  static handleError(error: Error, context?: unknown, component?: string, action?: string) {
    this.logger.error(error.message, error, context, component, action);
    
    // Send error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Add your error monitoring service here
    }
  }

  static handleAPIError(error: unknown, endpoint: string, method: string, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = `API Error: ${method} ${endpoint}`;
    this.logger.error(message, errorObj, { ...this.safeSpread(context), endpoint, method }, 'API', 'error');
  }

  static handleAuthError(error: unknown, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.logger.error('Authentication error', errorObj, context, 'Auth', 'error');
  }

  static handleValidationError(field: string, value: unknown, rule: string, context?: unknown) {
    const message = `Validation error: ${field} failed ${rule}`;
    this.logger.warn(message, { ...this.safeSpread(context), field, value, rule }, 'Validation', 'error');
  }

  static handleFormError(form: string, errors: unknown, context?: unknown) {
    const message = `Form validation errors: ${form}`;
    this.logger.warn(message, { ...this.safeSpread(context), form, errors }, 'Form', 'validation_error');
  }

  static handleNetworkError(error: unknown, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.logger.error('Network error', errorObj, context, 'Network', 'error');
  }

  static handleUnexpectedError(error: Error, context?: unknown) {
    this.logger.fatal('Unexpected error', error, context, 'System', 'fatal');
  }
}

// Hook for React components
export const useLogger = () => {
  const logger = Logger.getInstance();
  
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    fatal: logger.fatal.bind(logger),
    logUserAction: logger.logUserAction.bind(logger),
    logAPICall: logger.logAPICall.bind(logger),
    logComponentMount: logger.logComponentMount.bind(logger),
    logComponentUnmount: logger.logComponentUnmount.bind(logger),
    logPageView: logger.logPageView.bind(logger),
    logSearch: logger.logSearch.bind(logger),
    logBookingAction: logger.logBookingAction.bind(logger),
    logPaymentAction: logger.logPaymentAction.bind(logger),
  };
};

// Global error handler
window.addEventListener('error', (event) => {
  ErrorHandler.handleUnexpectedError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  ErrorHandler.handleUnexpectedError(error, {
    type: 'unhandledrejection',
    reason: event.reason,
  });
});

export default Logger;
