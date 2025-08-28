import { logger } from '@/services/logger';

class ErrorHandler {
  private static safeSpread(context?: unknown): Record<string, unknown> {
    return typeof context === 'object' && context !== null ? (context as Record<string, unknown>) : {};
  }

  static handleError(error: Error, context?: unknown, component?: string, action?: string) {
    const ctx = { ...this.safeSpread(context), component, action };
    logger.error(error.message, error, ctx);
    if (import.meta.env.PROD) {
      // place for external error monitoring service
    }
  }

  static handleAPIError(error: unknown, endpoint: string, method: string, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const ctx = { ...this.safeSpread(context), endpoint, method };
    logger.error(`API Error: ${method} ${endpoint}`, errorObj, ctx);
  }

  static handleAuthError(error: unknown, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Authentication error', errorObj, this.safeSpread(context));
  }

  static handleValidationError(field: string, value: unknown, rule: string, context?: unknown) {
    const ctx = { ...this.safeSpread(context), field, value, rule };
    logger.warn(`Validation error: ${field} failed ${rule}`, ctx);
  }

  static handleFormError(form: string, errors: unknown, context?: unknown) {
    const ctx = { ...this.safeSpread(context), form, errors };
    logger.warn(`Form validation errors: ${form}`, ctx);
  }

  static handleNetworkError(error: unknown, context?: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Network error', errorObj, this.safeSpread(context));
  }

  static handleUnexpectedError(error: Error, context?: unknown) {
    logger.error('Unexpected error', error, this.safeSpread(context));
  }
}

export { ErrorHandler };
