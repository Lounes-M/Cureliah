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
  context?: any;
  component?: string;
  action?: string;
}

export class Logger {
  private static instance: Logger;
  private sessionId: string;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

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

  private log(level: LogLevel, message: string, context?: any, component?: string, action?: string) {
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

    // Add user ID if available
    const user = supabase.auth.getUser();
    if (user) {
      entry.user_id = (user as any).id;
    }

    this.buffer.push(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  debug(message: string, context?: any, component?: string, action?: string) {
    this.log(LogLevel.DEBUG, message, context, component, action);
  }

  info(message: string, context?: any, component?: string, action?: string) {
    this.log(LogLevel.INFO, message, context, component, action);
  }

  warn(message: string, context?: any, component?: string, action?: string) {
    this.log(LogLevel.WARN, message, context, component, action);
  }

  error(message: string, error?: Error, context?: any, component?: string, action?: string) {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      stack_trace: error?.stack,
      context: { ...context, error: error?.message },
      component,
      action
    };

    this.buffer.push(entry);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  fatal(message: string, error?: Error, context?: any, component?: string, action?: string) {
    this.log(LogLevel.FATAL, message, { ...context, error: error?.message, stack: error?.stack }, component, action);
    this.flushBuffer(); // Immediately flush fatal errors
  }

  // Utility methods for common scenarios
  logUserAction(action: string, component: string, context?: any) {
    this.info(`User action: ${action}`, context, component, action);
  }

  logAPICall(endpoint: string, method: string, status: number, duration: number, context?: any) {
    const message = `API ${method} ${endpoint} - ${status} (${duration}ms)`;
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, message, { ...context, endpoint, method, status, duration }, 'API', 'call');
  }

  logComponentMount(component: string, props?: any) {
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

  logBookingAction(action: string, bookingId: string, context?: any) {
    this.info(`Booking ${action}: ${bookingId}`, { ...context, bookingId }, 'Booking', action);
  }

  logPaymentAction(action: string, paymentId: string, amount: number, context?: any) {
    this.info(`Payment ${action}: ${paymentId} - ${amount}€`, { ...context, paymentId, amount }, 'Payment', action);
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

  static handleError(error: Error, context?: any, component?: string, action?: string) {
    this.logger.error(error.message, error, context, component, action);
    
    // Send error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Add your error monitoring service here
    }
  }

  static handleAPIError(error: any, endpoint: string, method: string, context?: any) {
    const message = `API Error: ${method} ${endpoint}`;
    this.logger.error(message, error, { ...context, endpoint, method }, 'API', 'error');
  }

  static handleAuthError(error: any, context?: any) {
    this.logger.error('Authentication error', error, context, 'Auth', 'error');
  }

  static handleValidationError(field: string, value: any, rule: string, context?: any) {
    const message = `Validation error: ${field} failed ${rule}`;
    this.logger.warn(message, { ...context, field, value, rule }, 'Validation', 'error');
  }

  static handleFormError(form: string, errors: any, context?: any) {
    const message = `Form validation errors: ${form}`;
    this.logger.warn(message, { ...context, form, errors }, 'Form', 'validation_error');
  }

  static handleNetworkError(error: any, context?: any) {
    this.logger.error('Network error', error, context, 'Network', 'error');
  }

  static handleUnexpectedError(error: Error, context?: any) {
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
  ErrorHandler.handleUnexpectedError(new Error(event.reason), {
    type: 'unhandledrejection',
    reason: event.reason,
  });
});

export default Logger;
