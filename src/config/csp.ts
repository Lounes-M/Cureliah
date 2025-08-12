/**
 * Configuration Content Security Policy (CSP) pour Cureliah
 * Sécurise l'application contre les attaques XSS et injection de code
 */

// Domaines autorisés pour les différents types de contenu
const TRUSTED_DOMAINS = {
  // Supabase
  supabase: [
    'https://*.supabase.co',
    'https://*.supabase.com',
    'wss://*.supabase.co',
    'wss://*.supabase.com'
  ],
  
  // Stripe
  stripe: [
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    'https://js.stripe.com'
  ],
  
  // Analytics et cookies
  analytics: [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://cs.iubenda.com',
    'https://cdn.iubenda.com'
  ],
  
  // CDN et fonts
  fonts: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ]
};

// Génération des directives CSP
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Requis pour les scripts inline de config (à minimiser)
    ...TRUSTED_DOMAINS.stripe,
    ...TRUSTED_DOMAINS.analytics
  ],
  
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Requis pour Tailwind et CSS-in-JS
    ...TRUSTED_DOMAINS.fonts
  ],
  
  'font-src': [
    "'self'",
    'data:',
    ...TRUSTED_DOMAINS.fonts
  ],
  
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:'
  ],
  
  'connect-src': [
    "'self'",
    ...TRUSTED_DOMAINS.supabase,
    ...TRUSTED_DOMAINS.stripe,
    ...TRUSTED_DOMAINS.analytics
  ],
  
  'frame-src': [
    "'self'",
    'https://checkout.stripe.com',
    'https://js.stripe.com'
  ],
  
  'media-src': ["'self'", 'data:', 'blob:'],
  
  'object-src': ["'none'"],
  
  'base-uri': ["'self'"],
  
  'form-action': ["'self'", 'https://checkout.stripe.com'],
  
  'frame-ancestors': ["'none'"],
  
  'upgrade-insecure-requests': []
};

/**
 * Génère la chaîne CSP complète
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Génère la meta tag CSP pour le HTML
 */
export function generateCSPMetaTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${generateCSPHeader()}">`;
}

/**
 * Configuration CSP pour le développement (plus permissive)
 */
export function generateDevCSPHeader(): string {
  const devCSP = {
    ...CSP_DIRECTIVES,
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Requis pour HMR de Vite
      'http://localhost:*',
      'ws://localhost:*',
      ...TRUSTED_DOMAINS.stripe,
      ...TRUSTED_DOMAINS.analytics
    ],
    'connect-src': [
      "'self'",
      'http://localhost:*',
      'ws://localhost:*',
      'wss://localhost:*',
      ...TRUSTED_DOMAINS.supabase,
      ...TRUSTED_DOMAINS.stripe,
      ...TRUSTED_DOMAINS.analytics
    ]
  };

  return Object.entries(devCSP)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

// Export de la configuration pour Vite/Node.js
export const CSP_CONFIG = {
  production: generateCSPHeader(),
  development: generateDevCSPHeader(),
  metaTag: generateCSPMetaTag()
};

export default CSP_CONFIG;
