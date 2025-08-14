// ===================================
// SYSTÈME DE GESTION D'ERREURS CENTRALISÉ
// ===================================

import { toast } from 'sonner';

// ===================================
// TYPES D'ERREURS STRICTS
// ===================================

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export type ErrorCode = 
  // Erreurs d'authentification
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_INSUFFICIENT_PERMISSIONS'
  
  // Erreurs de réseau
  | 'NETWORK_CONNECTION_FAILED'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_SERVER_ERROR'
  | 'NETWORK_RATE_LIMITED'
  
  // Erreurs de validation
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_OUT_OF_RANGE'
  | 'VALIDATION_DUPLICATE_VALUE'
  
  // Erreurs de base de données
  | 'DB_CONNECTION_FAILED'
  | 'DB_QUERY_FAILED'
  | 'DB_CONSTRAINT_VIOLATION'
  | 'DB_RECORD_NOT_FOUND'
  
  // Erreurs de paiement
  | 'PAYMENT_CARD_DECLINED'
  | 'PAYMENT_INSUFFICIENT_FUNDS'
  | 'PAYMENT_PROCESSING_FAILED'
  | 'PAYMENT_STRIPE_ERROR'
  
  // Erreurs métier
  | 'BUSINESS_SUBSCRIPTION_REQUIRED'
  | 'BUSINESS_MISSION_EXPIRED'
  | 'BUSINESS_ALREADY_APPLIED'
  | 'BUSINESS_PROFILE_INCOMPLETE'
  
  // Erreurs système
  | 'SYSTEM_UNKNOWN_ERROR'
  | 'SYSTEM_SERVICE_UNAVAILABLE'
  | 'SYSTEM_MAINTENANCE_MODE';

export interface AppError extends Error {
  code: ErrorCode;
  level: ErrorLevel;
  context?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  requestId?: string;
  stack?: string;
}

export interface ErrorLogEntry {
  id: string;
  error: AppError;
  userAgent: string;
  url: string;
  timestamp: string;
  resolved: boolean;
}

// ===================================
// CLASSE D'ERREUR PERSONNALISÉE
// ===================================

export class CureliahError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly level: ErrorLevel;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly userId?: string;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    level: ErrorLevel = 'error',
    context?: Record<string, unknown>,
    userId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'CureliahError';
    this.code = code;
    this.level = level;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userId = userId;
    this.requestId = requestId;

    // Maintenir la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CureliahError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      level: this.level,
      context: this.context,
      timestamp: this.timestamp,
      userId: this.userId,
      requestId: this.requestId,
      stack: this.stack,
    };
  }
}

// ===================================
// MESSAGES D'ERREUR LOCALISÉS
// ===================================

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentification
  AUTH_INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  AUTH_USER_NOT_FOUND: 'Utilisateur introuvable',
  AUTH_EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre email avant de vous connecter',
  AUTH_SESSION_EXPIRED: 'Votre session a expiré, veuillez vous reconnecter',
  AUTH_INSUFFICIENT_PERMISSIONS: 'Vous n\'avez pas les permissions nécessaires',
  
  // Réseau
  NETWORK_CONNECTION_FAILED: 'Impossible de se connecter au serveur',
  NETWORK_TIMEOUT: 'La requête a expiré, veuillez réessayer',
  NETWORK_SERVER_ERROR: 'Erreur serveur, notre équipe a été notifiée',
  NETWORK_RATE_LIMITED: 'Trop de requêtes, veuillez patienter',
  
  // Validation
  VALIDATION_REQUIRED_FIELD: 'Ce champ est obligatoire',
  VALIDATION_INVALID_FORMAT: 'Le format de ce champ n\'est pas valide',
  VALIDATION_OUT_OF_RANGE: 'La valeur est en dehors de la plage autorisée',
  VALIDATION_DUPLICATE_VALUE: 'Cette valeur existe déjà',
  
  // Base de données
  DB_CONNECTION_FAILED: 'Erreur de connexion à la base de données',
  DB_QUERY_FAILED: 'Erreur lors de l\'exécution de la requête',
  DB_CONSTRAINT_VIOLATION: 'Les données ne respectent pas les contraintes',
  DB_RECORD_NOT_FOUND: 'Enregistrement introuvable',
  
  // Paiement
  PAYMENT_CARD_DECLINED: 'Votre carte a été refusée',
  PAYMENT_INSUFFICIENT_FUNDS: 'Fonds insuffisants',
  PAYMENT_PROCESSING_FAILED: 'Erreur lors du traitement du paiement',
  PAYMENT_STRIPE_ERROR: 'Erreur du processeur de paiement',
  
  // Métier
  BUSINESS_SUBSCRIPTION_REQUIRED: 'Un abonnement premium est requis pour cette fonctionnalité',
  BUSINESS_MISSION_EXPIRED: 'Cette mission a expiré',
  BUSINESS_ALREADY_APPLIED: 'Vous avez déjà postulé pour cette mission',
  BUSINESS_PROFILE_INCOMPLETE: 'Veuillez compléter votre profil',
  
  // Système
  SYSTEM_UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
  SYSTEM_SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
  SYSTEM_MAINTENANCE_MODE: 'Maintenance en cours, veuillez réessayer plus tard',
};

// ===================================
// GESTIONNAIRE D'ERREURS CENTRALISÉ
// ===================================

class ErrorManager {
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  /**
   * Gère une erreur et l'affiche à l'utilisateur
   */
  public handleError(error: Error | CureliahError, showToast = true): void {
    let appError: CureliahError;

    if (error instanceof CureliahError) {
      appError = error;
    } else {
      // Convertir l'erreur générique en CureliahError
      appError = new CureliahError(
        'SYSTEM_UNKNOWN_ERROR',
        error.message || 'Une erreur inattendue s\'est produite',
        'error',
        { originalError: error.name }
      );
    }

    // Logger l'erreur
    this.logError(appError);

    // Afficher le toast si demandé
    if (showToast) {
      this.showErrorToast(appError);
    }

    // Envoyer à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(appError);
    }
  }

  /**
   * Enregistre l'erreur localement
   */
  private logError(error: CureliahError): void {
    const logEntry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    // Ajouter au début du tableau
    this.errorLogs.unshift(logEntry);

    // Limiter le nombre de logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }

    // Logger dans la console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Cureliah Error:', {
        code: error.code,
        message: error.message,
        level: error.level,
        context: error.context,
        stack: error.stack,
      });
    }
  }

  /**
   * Affiche un toast d'erreur approprié
   */
  private showErrorToast(error: CureliahError): void {
    const message = ERROR_MESSAGES[error.code] || error.message;

    switch (error.level) {
      case 'info':
        toast.info(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'error':
        toast.error(message, {
          duration: 5000,
          action: error.level === 'critical' ? {
            label: 'Contacter le support',
            onClick: () => this.contactSupport(error),
          } : undefined,
        });
        break;
      case 'critical':
        toast.error(message, {
          duration: 10000,
          action: {
            label: 'Contacter le support',
            onClick: () => this.contactSupport(error),
          },
        });
        break;
    }
  }

  /**
   * Envoie l'erreur à un service de monitoring
   */
  private sendToMonitoring(error: CureliahError): void {
    // Implémenter l'envoi vers Sentry, LogRocket, etc.
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error.toJSON()),
      }).catch(() => {
        // Erreur silencieuse pour éviter les boucles d'erreur
      });
    } catch {
      // Erreur silencieuse
    }
  }

  /**
   * Ouvre le chat de support avec les détails de l'erreur
   */
  private contactSupport(error: CureliahError): void {
    const supportUrl = `/support?error=${encodeURIComponent(JSON.stringify({
      code: error.code,
      timestamp: error.timestamp,
      requestId: error.requestId,
    }))}`;
    
    window.open(supportUrl, '_blank');
  }

  /**
   * Récupère les logs d'erreur pour le debugging
   */
  public getErrorLogs(): ErrorLogEntry[] {
    return [...this.errorLogs];
  }

  /**
   * Efface les logs d'erreur
   */
  public clearErrorLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Marque une erreur comme résolue
   */
  public markAsResolved(errorId: string): void {
    const errorLog = this.errorLogs.find(log => log.id === errorId);
    if (errorLog) {
      errorLog.resolved = true;
    }
  }
}

// ===================================
// INSTANCE GLOBALE
// ===================================

export const errorManager = new ErrorManager();

// ===================================
// FONCTIONS UTILITAIRES
// ===================================

/**
 * Crée une nouvelle erreur Cureliah
 */
export function createError(
  code: ErrorCode,
  message?: string,
  level: ErrorLevel = 'error',
  context?: Record<string, unknown>
): CureliahError {
  return new CureliahError(
    code,
    message || ERROR_MESSAGES[code],
    level,
    context
  );
}

/**
 * Gère une erreur de manière simple
 */
export function handleError(error: Error | CureliahError, showToast = true): void {
  errorManager.handleError(error, showToast);
}

/**
 * Wrapper pour les fonctions async qui peuvent lever des erreurs
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorCode?: ErrorCode
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof CureliahError 
        ? error 
        : createError(
            errorCode || 'SYSTEM_UNKNOWN_ERROR',
            error instanceof Error ? error.message : 'Erreur inconnue'
          );
      
      handleError(appError);
      return null;
    }
  };
}

/**
 * Hook pour les erreurs dans les composants React
 */
export function useErrorHandler() {
  const handleError = (error: Error | CureliahError, showToast = true) => {
    errorManager.handleError(error, showToast);
  };

  const createAndHandleError = (
    code: ErrorCode,
    message?: string,
    level: ErrorLevel = 'error',
    context?: Record<string, unknown>,
    showToast = true
  ) => {
    const error = createError(code, message, level, context);
    handleError(error, showToast);
  };

  return {
    handleError,
    createAndHandleError,
    getErrorLogs: () => errorManager.getErrorLogs(),
    clearErrorLogs: () => errorManager.clearErrorLogs(),
  };
}

// ===================================
// EXPORTS
// ===================================

export default errorManager;
