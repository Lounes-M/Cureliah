import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { logger } from "@/services/logger";

// Types pour les tests A/B
interface ABTestConfig {
  testName: string;
  variants: string[];
  weights?: number[];
  enabled?: boolean;
}

interface ABTestContextType {
  getVariant: (testName: string) => string;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  setUserProperty: (property: string, value: any) => void;
}

interface ABTestProviderProps {
  children: ReactNode;
  userId: string;
  userSegment?: string;
}

// Context pour les tests A/B
const ABTestContext = createContext<ABTestContextType | null>(null);

// Configuration des tests A/B (peut être étendue selon les besoins)
const AB_TESTS: Record<string, ABTestConfig> = {
  'premium-pricing': {
    testName: 'premium-pricing',
    variants: ['control', 'variant_a', 'variant_b'],
    weights: [0.4, 0.3, 0.3],
    enabled: true
  },
  'urgent-requests-ui': {
    testName: 'urgent-requests-ui',
    variants: ['standard', 'enhanced'],
    weights: [0.5, 0.5],
    enabled: true
  },
  'dashboard-layout': {
    testName: 'dashboard-layout',
    variants: ['sidebar', 'tabs'],
    weights: [0.6, 0.4],
    enabled: false
  }
};

// Provider des tests A/B
export const ABTestProvider: React.FC<ABTestProviderProps> = ({ 
  children, 
  userId, 
  userSegment 
}) => {
  const [variants, setVariants] = useState<Record<string, string>>({});

  // Fonction pour déterminer la variante d'un utilisateur
  const getVariant = (testName: string): string => {
    // Si déjà calculé, retourner la variante stockée
    if (variants[testName]) {
      return variants[testName];
    }

    const testConfig = AB_TESTS[testName];
    
    // Test non configuré ou désactivé
    if (!testConfig || !testConfig.enabled) {
      return 'control';
    }

    // Génération déterministe basée sur l'ID utilisateur
    const hash = hashString(userId + testName);
    const randomValue = (hash % 100) / 100; // Valeur entre 0 et 1

    // Sélection de la variante selon les poids
    const weights = testConfig.weights || testConfig.variants.map(() => 1 / testConfig.variants.length);
    let cumulativeWeight = 0;
    
    for (let i = 0; i < testConfig.variants.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        const selectedVariant = testConfig.variants[i];
        
        // Stocker la variante pour cohérence
        setVariants(prev => ({
          ...prev,
          [testName]: selectedVariant
        }));
        
        return selectedVariant;
      }
    }

    // Fallback au contrôle
    return 'control';
  };

  // Fonction de tracking des événements
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // En production, envoyer vers votre service d'analytics
    logger.debug(`[A/B Test] Event: ${eventName}`, {
      userId,
      userSegment,
      variants,
      properties,
      timestamp: new Date().toISOString()
    });
    
    // Exemple d'intégration avec des services d'analytics
    if (typeof window !== 'undefined') {
      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, {
          ...properties,
          user_id: userId,
          user_segment: userSegment,
          ab_variants: JSON.stringify(variants)
        });
      }
      
      // Mixpanel, Amplitude, etc.
      if ((window as any).mixpanel) {
        (window as any).mixpanel.track(eventName, {
          ...properties,
          userId,
          userSegment,
          variants
        });
      }
    }
  };

  // Fonction pour définir les propriétés utilisateur
  const setUserProperty = (property: string, value: any) => {
    logger.info(`[A/B Test] User Property: ${property} = ${value}`, { userId });
    
    // En production, synchroniser avec votre service d'analytics
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.people.set({ [property]: value });
    }
  };

  // Initialiser les variantes au montage
  useEffect(() => {
    if (userId) {
      // Pré-calculer les variantes pour tous les tests actifs
      const initialVariants: Record<string, string> = {};
      
      Object.keys(AB_TESTS).forEach(testName => {
        initialVariants[testName] = getVariant(testName);
      });
      
      setVariants(initialVariants);
      
      // Tracker l'assignation des variantes
      trackEvent('ab_test_assignment', {
        variants: initialVariants,
        userSegment
      });
    }
  }, [userId, userSegment]);

  const contextValue: ABTestContextType = {
    getVariant,
    trackEvent,
    setUserProperty
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
};

// Hook pour utiliser les tests A/B
export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
};

// Hook spécialisé pour récupérer une variante
export const useVariant = (testName: string): string => {
  const { getVariant } = useABTest();
  return getVariant(testName);
};

// Fonction utilitaire de hashage simple
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32-bit integer
  }
  return Math.abs(hash);
}

// Composant HOC pour tester les variantes
export const withABTest = (
  testName: string,
  variants: Record<string, React.ComponentType<any>>
) => {
  return (props: any) => {
    const variant = useVariant(testName);
    const Component = variants[variant] || variants.control || variants.default;
    
    if (!Component) {
      logger.warn(`[A/B Test] No component found for variant "${variant}" in test "${testName}"`);
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Business Intelligence utilities
export const BusinessIntelligence = {
  // Segmentation d'utilisateurs
  segmentUser: (user: any) => {
    if (!user) return 'anonymous';
    
    // Logique de segmentation selon vos critères business
    if (user.subscription_plan === 'premium') return 'premium';
    if (user.account_type === 'doctor') return 'doctor';
    if (user.account_type === 'establishment') return 'establishment';
    if (user.created_at && new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      return 'new_user';
    }
    
    return 'standard';
  },

  // Métriques clés
    trackConversion: (conversionType: string, value?: number) => {
      logger.info(`[BI] Conversion: ${conversionType}`, { value, timestamp: new Date() });
    },  // Analyse des fonctionnalités
  trackFeatureUsage: (featureName: string, userId: string) => {
    logger.info(`[BI] Feature Usage: ${featureName}`, { userId, timestamp: new Date() });
  }
};

export default ABTestProvider;
