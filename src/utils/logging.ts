/**
 * Utilitaire centralisé pour remplacer les console.log/console.error
 * par le système de logging approprié selon l'environnement
 */

import { logger } from '@/services/logger';

// Types pour améliorer la lisibilité
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

/**
 * Logger centralisé qui remplace console.log/console.error
 * Utilise le service logger en production et console en développement
 */
class CentralizedLogger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log d'information (remplace console.log)
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      logger.info(`ℹ️ ${message}`, context || '');
    } else {
      logger.info(message, context);
    }
  }

  /**
   * Log de debug (pour le développement principalement)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      logger.info(`🐛 ${message}`, context || '');
    } else {
      logger.debug(message, context);
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      logger.warn(`⚠️ ${message}`, context || '');
    } else {
      logger.warn(message, context);
    }
  }

  /**
   * Log d'erreur (remplace console.error)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.isDevelopment) {
      logger.error(`❌ ${message}`, error || '', context || '');
    } else {
      // Assurer que l'erreur est au bon format pour le logger
      const errorToLog = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
      logger.error(message, errorToLog, context);
    }
  }

  /**
   * Log de succès pour les actions importantes
   */
  success(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      logger.info(`✅ ${message}`, context || '');
    } else {
      logger.info(`SUCCESS: ${message}`, context);
    }
  }

  /**
   * Log spécifique pour les événements utilisateur (analytics)
   */
  userAction(action: string, userId?: string, context?: LogContext) {
    const actionContext = {
      ...context,
      userId,
      timestamp: new Date().toISOString(),
      type: 'user_action'
    };

    if (this.isDevelopment) {
      logger.info(`👤 USER ACTION: ${action}`, actionContext);
    } else {
      logger.info(`USER_ACTION: ${action}`, actionContext);
    }
  }

  /**
   * Log spécifique pour les événements de performance
   */
  performance(metric: string, value: number, context?: LogContext) {
    const perfContext = {
      ...context,
      metric,
      value,
      timestamp: new Date().toISOString(),
      type: 'performance'
    };

    if (this.isDevelopment) {
      logger.info(`⚡ PERF: ${metric} = ${value}`, perfContext);
    } else {
      logger.info(`PERFORMANCE: ${metric}`, perfContext);
    }
  }

  /**
   * Log spécifique pour les événements de sécurité
   */
  security(event: string, context?: LogContext) {
    const securityContext = {
      ...context,
      timestamp: new Date().toISOString(),
      type: 'security',
      level: 'high'
    };

    if (this.isDevelopment) {
      logger.warn(`🔒 SECURITY: ${event}`, securityContext);
    } else {
      logger.warn(`SECURITY: ${event}`, securityContext);
    }
  }
}

// Instance globale exportée
export const log = new CentralizedLogger();

// Fonctions de migration pour faciliter le remplacement
export const logInfo = (message: string, context?: LogContext) => log.info(message, context);
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => log.error(message, error, context);
export const logWarn = (message: string, context?: LogContext) => log.warn(message, context);
export const logDebug = (message: string, context?: LogContext) => log.debug(message, context);
export const logSuccess = (message: string, context?: LogContext) => log.success(message, context);

// Types pour l'export
export type { LogLevel, LogContext };
