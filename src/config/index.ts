// Environment configuration
export const config = {
  app: {
    name: 'Cureliah',
    version: '1.0.0',
    environment: import.meta.env.NODE_ENV || 'development',
    baseUrl: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8082',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8082/api',
  },
  
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
  },
  
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    enableMessaging: import.meta.env.VITE_ENABLE_MESSAGING !== 'false',
    enableReviews: import.meta.env.VITE_ENABLE_REVIEWS !== 'false',
    enablePayments: import.meta.env.VITE_ENABLE_PAYMENTS !== 'false',
    enableDocuments: import.meta.env.VITE_ENABLE_DOCUMENTS !== 'false',
    enableSmartScheduling: import.meta.env.VITE_ENABLE_SMART_SCHEDULING === 'true',
    enableMobileApp: import.meta.env.VITE_ENABLE_MOBILE_APP === 'true',
    enablePremiumFeatures: import.meta.env.VITE_ENABLE_PREMIUM_FEATURES === 'true',
    enableAdminPanel: import.meta.env.VITE_ENABLE_ADMIN_PANEL !== 'false',
    maintenanceMode: import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  },
  
  ui: {
    theme: import.meta.env.VITE_UI_THEME || 'light',
    primaryColor: import.meta.env.VITE_UI_PRIMARY_COLOR || '#3b82f6',
    showBranding: import.meta.env.VITE_SHOW_BRANDING !== 'false',
    enableAnimations: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
    compactMode: import.meta.env.VITE_COMPACT_MODE === 'true',
  },
  
  security: {
    enableCORS: import.meta.env.VITE_ENABLE_CORS !== 'false',
    enableCSP: import.meta.env.VITE_ENABLE_CSP === 'true',
    enableHttpsRedirect: import.meta.env.VITE_ENABLE_HTTPS_REDIRECT === 'true',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600'),
    maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
    requireEmailVerification: import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION !== 'false',
    requirePhoneVerification: import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === 'true',
  },
  
  uploads: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
    enableVirusScanning: import.meta.env.VITE_ENABLE_VIRUS_SCANNING === 'true',
  },
  
  notifications: {
    enableEmail: import.meta.env.VITE_ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enablePush: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
    enableSMS: import.meta.env.VITE_ENABLE_SMS_NOTIFICATIONS === 'true',
    emailProvider: import.meta.env.VITE_EMAIL_PROVIDER || 'smtp',
    smsProvider: import.meta.env.VITE_SMS_PROVIDER || 'twilio',
  },
  
  integrations: {
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    calendarProvider: import.meta.env.VITE_CALENDAR_PROVIDER || 'google',
    enableGoogleCalendar: import.meta.env.VITE_ENABLE_GOOGLE_CALENDAR === 'true',
    enableOutlookCalendar: import.meta.env.VITE_ENABLE_OUTLOOK_CALENDAR === 'true',
    enableZoomIntegration: import.meta.env.VITE_ENABLE_ZOOM_INTEGRATION === 'true',
    enableTeamsIntegration: import.meta.env.VITE_ENABLE_TEAMS_INTEGRATION === 'true',
  },
  
  analytics: {
    enableTracking: import.meta.env.VITE_ENABLE_TRACKING === 'true',
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '',
    enableHotjar: import.meta.env.VITE_ENABLE_HOTJAR === 'true',
    hotjarId: import.meta.env.VITE_HOTJAR_ID || '',
    enableSentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  },
  
  cache: {
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
    cacheVersion: import.meta.env.VITE_CACHE_VERSION || '1.0.0',
    offlineSupport: import.meta.env.VITE_OFFLINE_SUPPORT === 'true',
  },
  
  performance: {
    enableLazyLoading: import.meta.env.VITE_ENABLE_LAZY_LOADING !== 'false',
    enableCodeSplitting: import.meta.env.VITE_ENABLE_CODE_SPLITTING !== 'false',
    enableImageOptimization: import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION === 'true',
    enablePrefetching: import.meta.env.VITE_ENABLE_PREFETCHING === 'true',
  },
  
  booking: {
    maxAdvanceBookingDays: parseInt(import.meta.env.VITE_MAX_ADVANCE_BOOKING_DAYS || '90'),
    minAdvanceBookingHours: parseInt(import.meta.env.VITE_MIN_ADVANCE_BOOKING_HOURS || '24'),
    defaultBookingDuration: parseInt(import.meta.env.VITE_DEFAULT_BOOKING_DURATION || '60'),
    maxBookingDuration: parseInt(import.meta.env.VITE_MAX_BOOKING_DURATION || '480'),
    enableAutoCancellation: import.meta.env.VITE_ENABLE_AUTO_CANCELLATION === 'true',
    autoCancellationHours: parseInt(import.meta.env.VITE_AUTO_CANCELLATION_HOURS || '24'),
    enableBookingReminders: import.meta.env.VITE_ENABLE_BOOKING_REMINDERS !== 'false',
    reminderHoursBefore: parseInt(import.meta.env.VITE_REMINDER_HOURS_BEFORE || '24'),
  },
  
  payments: {
    currency: import.meta.env.VITE_PAYMENT_CURRENCY || 'EUR',
    commissionRate: parseFloat(import.meta.env.VITE_COMMISSION_RATE || '0.1'),
    minimumAmount: parseFloat(import.meta.env.VITE_MINIMUM_PAYMENT_AMOUNT || '10'),
    maximumAmount: parseFloat(import.meta.env.VITE_MAXIMUM_PAYMENT_AMOUNT || '10000'),
    enableInstallments: import.meta.env.VITE_ENABLE_INSTALLMENTS === 'true',
    enableRefunds: import.meta.env.VITE_ENABLE_REFUNDS !== 'false',
    refundDeadlineHours: parseInt(import.meta.env.VITE_REFUND_DEADLINE_HOURS || '48'),
  },
  
  rate_limiting: {
    enableRateLimit: import.meta.env.VITE_ENABLE_RATE_LIMIT === 'true',
    maxRequestsPerMinute: parseInt(import.meta.env.VITE_MAX_REQUESTS_PER_MINUTE || '60'),
    maxLoginAttemptsPerHour: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS_PER_HOUR || '10'),
  },
};

// Helper functions for config validation
export const validateConfig = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isStaging = () => config.app.environment === 'staging';

export const getFeatureFlag = (feature: keyof typeof config.features) => {
  return config.features[feature];
};

export const getApiUrl = (path: string = '') => {
  return `${config.app.apiUrl}${path}`;
};

export const getAssetUrl = (asset: string) => {
  return `${config.app.baseUrl}/assets/${asset}`;
};

// Initialize configuration validation in development
if (isDevelopment()) {
  try {
    validateConfig();
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
  }
}

export default config;
