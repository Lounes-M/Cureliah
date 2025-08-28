// Structured logging service for production-ready logging
interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: LogContext;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private userId?: string;
  
  private createLogEntry(level: LogEntry['level'], message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context: { userId: this.userId, ...context },
      timestamp: new Date().toISOString()
    };
  }

  private formatLogMessage(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context) {
      formattedMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formattedMessage;
  }

  private shouldLog(level: LogEntry['level']): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context);
    
    if (this.isDevelopment) {
      // Enhanced console output for development
      console.log(`ℹ️ ${message}`, context ? context : '');
    } else {
      // Structured logging for production (could be sent to external service)
      console.log(this.formatLogMessage(entry));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(`⚠️ ${message}`, context ? context : '');
    } else {
      console.warn(this.formatLogMessage(entry));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    let errorDetails = undefined;
    if (error) {
      // If error is a Supabase error, include all properties
      errorDetails = {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
        ...error
      };
    }
    const fullContext = {
      ...context,
      error: errorDetails
    };
    
    const entry = this.createLogEntry('error', message, fullContext);
    
    if (this.isDevelopment) {
      console.error(`❌ ${message}`, error || '', fullContext || '');
    } else {
      console.error(this.formatLogMessage(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context);
    
    if (this.isDevelopment) {
      console.debug(`🔍 ${message}`, context ? context : '');
    } else {
      console.debug(this.formatLogMessage(entry));
    }
  }

  setUserId(userId?: string): void {
    this.userId = userId;
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    this.info(message, { ...context, operation, duration, type: 'performance' });
  }

  // User action logging
  userAction(action: string, userId: string, context?: LogContext): void {
    this.info(`User action: ${action}`, { 
      ...context, 
      userId, 
      action, 
      type: 'user_action' 
    });
  }

  // API call logging
  apiCall(endpoint: string, method: string, status: number, duration?: number, context?: LogContext): void {
    const message = `API ${method} ${endpoint} - ${status}${duration ? ` (${duration}ms)` : ''}`;
    const logContext = {
      ...context,
      endpoint,
      method,
      status,
      duration,
      type: 'api_call'
    };

    if (status >= 400) {
      this.error(message, undefined, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  // Database operation logging
  dbOperation(operation: string, table: string, success: boolean, context?: LogContext): void {
    const message = `DB ${operation} on ${table} - ${success ? 'success' : 'failed'}`;
    const logContext = {
      ...context,
      operation,
      table,
      success,
      type: 'db_operation'
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.error(message, undefined, logContext);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogContext };
