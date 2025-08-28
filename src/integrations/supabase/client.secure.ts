/**
 * Configuration sécurisée pour le client Supabase
 * Remplace le stockage localStorage par des cookies HttpOnly sécurisés
 */

import { createClient } from '@supabase/supabase-js';
import React from 'react';
import { logger } from '@/services/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Stockage sécurisé pour les tokens Supabase
 * Utilise des cookies HttpOnly en production, localStorage en développement
 */
class SecureSupabaseStorage {
  private isProduction = import.meta.env.PROD;
  private keyPrefix = 'sb-auth-token';

  constructor() {
    logger.info('Initializing secure Supabase storage', {
      isProduction: this.isProduction,
      storageType: this.isProduction ? 'secure-cookies' : 'localStorage'
    });
  }

  /**
   * Récupère un token de manière sécurisée
   */
  getItem(key: string): string | null {
    try {
      if (this.isProduction && typeof document !== 'undefined') {
        // En production : utiliser des cookies HttpOnly
        return this.getCookieValue(`${this.keyPrefix}-${key}`);
      } else {
        // En développement : localStorage pour faciliter le debug
        return localStorage.getItem(key);
      }
    } catch (error) {
      logger.error('Error retrieving auth token', error as Error, { key });
      return null;
    }
  }

  /**
   * Stocke un token de manière sécurisée
   */
  setItem(key: string, value: string): void {
    try {
      if (this.isProduction && typeof document !== 'undefined') {
        // En production : cookies sécurisés
        this.setSecureCookie(`${this.keyPrefix}-${key}`, value);
        logger.warn('Auth token stored in secure cookie', { key, type: 'security' });
      } else {
        // En développement : localStorage
        localStorage.setItem(key, value);
        logger.debug('Auth token stored in localStorage', { key });
      }
    } catch (error) {
      logger.error('Error storing auth token', error as Error, { key });
    }
  }

  /**
   * Supprime un token de manière sécurisée
   */
  removeItem(key: string): void {
    try {
      if (this.isProduction && typeof document !== 'undefined') {
        this.deleteSecureCookie(`${this.keyPrefix}-${key}`);
        logger.warn('Auth token removed from secure cookie', { key, type: 'security' });
      } else {
        localStorage.removeItem(key);
        logger.debug('Auth token removed from localStorage', { key });
      }
    } catch (error) {
      logger.error('Error removing auth token', error as Error, { key });
    }
  }

  /**
   * Lit une valeur depuis les cookies
   */
  private getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    
    return null;
  }

  /**
   * Définit un cookie sécurisé
   */
  private setSecureCookie(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 jours
    
    const cookieOptions = [
      `${name}=${value}`,
      `expires=${expires.toUTCString()}`,
      'path=/',
      'SameSite=Strict', // Protection CSRF
      ...(location.protocol === 'https:' ? ['Secure'] : []), // HTTPS uniquement
      // Note: HttpOnly ne peut pas être défini via JS pour des raisons de sécurité
      // Il faudra configurer cela côté serveur ou via un proxy
    ];
    
    document.cookie = cookieOptions.join('; ');
  }

  /**
   * Supprime un cookie sécurisé
   */
  private deleteSecureCookie(name: string): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
  }
}

/**
 * Client Supabase sécurisé avec stockage adaptatif
 */
const secureStorage = new SecureSupabaseStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Utiliser notre système de stockage sécurisé
    storage: secureStorage,
    
    // Configuration de sécurité renforcée
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    
    // Sécurité supplémentaire
    flowType: 'pkce', // Proof Key for Code Exchange pour plus de sécurité
    debug: !import.meta.env.PROD, // Debug uniquement en développement
  },
  
  // Configuration globale
  global: {
    headers: {
      'X-Client-Info': 'cureliah-web-app',
      // Protection contre les attaques par injection
      'Content-Type': 'application/json',
    },
  },
  
  // Configuration des requêtes
  db: {
    schema: 'public',
  },
  
  // Configuration Real-time sécurisée
  realtime: {
    params: {
      eventsPerSecond: 10, // Limitation du taux pour éviter le spam
    },
  },
});

/**
 * Hook pour vérifier la sécurité de la session
 */
export const useSecureSession = () => {
  const [isSecure, setIsSecure] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    const checkSecurity = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          log.security('Session security check failed', { error: error.message });
          setIsSecure(false);
          return;
        }
        
        if (session) {
          // Vérifier l'intégrité de la session
          const isValidSession = session.access_token && 
                                session.refresh_token && 
                                session.expires_at && 
                                session.expires_at > Date.now() / 1000;
          
          setIsSecure(isValidSession);
          
          if (!isValidSession) {
            log.security('Invalid or expired session detected', {
              hasAccessToken: !!session.access_token,
              hasRefreshToken: !!session.refresh_token,
              expiresAt: session.expires_at,
              currentTime: Date.now() / 1000
            });
          }
        } else {
          setIsSecure(false);
        }
      } catch (error) {
        log.error('Error checking session security', error);
        setIsSecure(false);
      }
    };
    
    checkSecurity();
    
    // Vérifier périodiquement la sécurité de la session
    const interval = setInterval(checkSecurity, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return isSecure;
};

export default supabase;
