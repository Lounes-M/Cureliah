// ===================================
// SERVICE DE LOGGER CENTRALISÉ
// ===================================

type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
  url: string;
  userAgent: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'info',
      enableConsole: process.env.NODE_ENV === 'development',
      enableStorage: true,
      enableRemote: process.env.NODE_ENV === 'production',
      maxStorageEntries: 1000,
      remoteEndpoint: '/api/logs',
      ...config,
    };

    this.sessionId = crypto.randomUUID();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      stack: new Error().stack,
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(`%c${prefix}`, style, entry.message, entry.context);
        break;
      case 'info':
        console.info(`%c${prefix}`, style, entry.message, entry.context);
        break;
      case 'warning':
        console.warn(`%c${prefix}`, style, entry.message, entry.context);
        break;
      case 'error':
      case 'critical':
        console.error(`%c${prefix}`, style, entry.message, entry.context, entry.stack);
        break;
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: bold;',
      warning: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      critical: 'color: #DC2626; font-weight: bold; background: #FEE2E2; padding: 2px 4px;',
    };
    return styles[level];
  }

  private storeLog(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.logs.unshift(entry);

    // Limiter le nombre d'entrées stockées
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(0, this.config.maxStorageEntries);
    }

    // Persister dans localStorage pour le debugging
    try {
      const storedLogs = this.logs.slice(0, 100); // Ne stocker que les 100 dernières
      localStorage.setItem('cureliah_logs', JSON.stringify(storedLogs));
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch {
      // Erreur silencieuse pour éviter les boucles d'erreur
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);

    // Log immédiat dans la console
    this.logToConsole(entry);

    // Stocker localement
    this.storeLog(entry);

    // Envoyer vers le serveur en async
    if (entry.level === 'error' || entry.level === 'critical') {
      this.sendToRemote(entry).catch(() => {
        // Erreur silencieuse
      });
    }
  }

  // ===================================
  // MÉTHODES PUBLIQUES
  // ===================================

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warning(message: string, context?: Record<string, unknown>): void {
    this.log('warning', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  critical(message: string, context?: Record<string, unknown>): void {
    this.log('critical', message, context);
  }

  // Méthodes spécialisées pour différents types d'événements
  userAction(action: string, details?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, { ...details, category: 'user_action' });
  }

  apiCall(method: string, url: string, duration?: number, status?: number): void {
    const level = status && status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method} ${url}`, {
      category: 'api_call',
      method,
      url,
      duration,
      status,
    });
  }

  performance(metric: string, value: number, unit = 'ms'): void {
    this.info(`Performance: ${metric}`, {
      category: 'performance',
      metric,
      value,
      unit,
    });
  }

  security(event: string, details?: Record<string, unknown>): void {
    this.warning(`Security event: ${event}`, { ...details, category: 'security' });
  }

  database(operation: string, table: string, duration?: number, error?: Error): void {
    const level = error ? 'error' : 'debug';
    this.log(level, `DB ${operation} on ${table}`, {
      category: 'database',
      operation,
      table,
      duration,
      error: error?.message,
    });
  }

  // ===================================
  // MÉTHODES UTILITAIRES
  // ===================================

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(0, limit);
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('cureliah_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setUserId(userId: string): void {
    this.logs.forEach(log => {
      if (!log.userId) {
        log.userId = userId;
      }
    });
  }

  setRequestId(requestId: string): void {
    // Pour associer les logs à une requête spécifique
    const recentLogs = this.logs.filter(
      log => Date.now() - new Date(log.timestamp).getTime() < 5000
    );
    
    recentLogs.forEach(log => {
      log.requestId = requestId;
    });
  }

  // ===================================
  // MÉTHODES DE MONITORING
  // ===================================

  getStatistics() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      last24h: 0,
      errors: 0,
    };

    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Count last 24h
      if (new Date(log.timestamp).getTime() > last24h) {
        stats.last24h++;
      }

      // Count errors
      if (log.level === 'error' || log.level === 'critical') {
        stats.errors++;
      }
    });

    return stats;
  }

  // ===================================
  // INTÉGRATION AVEC LES PERFORMANCE API
  // ===================================

  measurePerformance(name: string, fn: () => void): void;
  measurePerformance<T>(name: string, fn: () => T): T;
  measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T>;
  measurePerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then(resolved => {
            const duration = performance.now() - start;
            this.performance(name, duration);
            return resolved;
          })
          .catch(error => {
            const duration = performance.now() - start;
            this.error(`Performance measurement failed for ${name}`, {
              duration,
              error: error.message,
            });
            throw error;
          });
      } else {
        const duration = performance.now() - start;
        this.performance(name, duration);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Performance measurement failed for ${name}`, {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// ===================================
// INSTANCE GLOBALE
// ===================================

export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

export default logger;
