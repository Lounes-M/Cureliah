/**
 * Palette de couleurs unifiée pour Cureliah
 * Remplace les couleurs Tailwind standard par notre palette médicale cohérente
 */

export const CURELIAH_COLORS = {
  // Couleurs principales médicales
  primary: {
    blue: {
      DEFAULT: '#2563eb',   // medical-blue
      dark: '#1d4ed8',      // medical-blue-dark  
      light: '#3b82f6',     // medical-blue-light
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe', 
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',       // Base
      600: '#2563eb',       // DEFAULT
      700: '#1d4ed8',       // Dark
      800: '#1e40af',
      900: '#1e3a8a'
    },
    green: {
      DEFAULT: '#10b981',   // medical-green
      dark: '#059669',      // medical-green-dark
      light: '#34d399',     // medical-green-light
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7', 
      400: '#34d399',       // Light
      500: '#10b981',       // DEFAULT
      600: '#059669',       // Dark
      700: '#047857',
      800: '#065f46',
      900: '#064e3b'
    }
  },

  // États et statuts
  status: {
    success: '#10b981',    // medical-green
    warning: '#f59e0b',    // Amber-500
    error: '#ef4444',      // Red-500
    info: '#2563eb',       // medical-blue
    pending: '#6b7280',    // Gray-500
  },

  // Urgence et priorité
  urgency: {
    critical: '#dc2626',   // Red-600
    high: '#ea580c',       // Orange-600  
    medium: '#d97706',     // Amber-600
    low: '#65a30d',        // Lime-600
    none: '#6b7280'        // Gray-500
  },

  // Rôles utilisateurs
  roles: {
    doctor: '#2563eb',      // medical-blue
    establishment: '#7c3aed', // Violet-600
    admin: '#dc2626',       // Red-600
    guest: '#6b7280'        // Gray-500
  },

  // Abonnements
  subscription: {
    essentiel: '#2563eb',   // medical-blue
    pro: '#7c3aed',         // Violet-600  
    premium: '#f59e0b',     // Gold/Amber-500
    free: '#6b7280'         // Gray-500
  },

  // Interface utilisateur
  ui: {
    background: '#ffffff',
    surface: '#f9fafb',     // Gray-50
    border: '#e5e7eb',      // Gray-200
    divider: '#d1d5db',     // Gray-300
    disabled: '#9ca3af',    // Gray-400
    placeholder: '#6b7280', // Gray-500
    text: {
      primary: '#111827',   // Gray-900
      secondary: '#4b5563', // Gray-600  
      tertiary: '#6b7280',  // Gray-500
      inverse: '#ffffff'
    }
  },

  // Interaction et focus
  interaction: {
    hover: 'rgba(37, 99, 235, 0.1)',      // medical-blue/10
    focus: 'rgba(37, 99, 235, 0.2)',      // medical-blue/20
    active: 'rgba(37, 99, 235, 0.3)',     // medical-blue/30
    selected: 'rgba(16, 185, 129, 0.1)'   // medical-green/10
  }
} as const;

/**
 * Classes CSS utilitaires pour remplacer les classes Tailwind standard
 */
export const COLOR_CLASSES = {
  // Remplacements pour bg-blue-600 → bg-medical-blue
  primary: {
    bg: 'bg-medical-blue',
    bgHover: 'hover:bg-medical-blue-dark',
    bgLight: 'bg-medical-blue-light', 
    text: 'text-medical-blue',
    textHover: 'hover:text-medical-blue-dark',
    border: 'border-medical-blue'
  },

  // Remplacements pour bg-green-600 → bg-medical-green
  secondary: {
    bg: 'bg-medical-green',
    bgHover: 'hover:bg-medical-green-dark', 
    bgLight: 'bg-medical-green-light',
    text: 'text-medical-green',
    textHover: 'hover:text-medical-green-dark',
    border: 'border-medical-green'
  },

  // États
  success: {
    bg: 'bg-medical-green',
    text: 'text-medical-green-dark',
    border: 'border-medical-green'
  },
  
  error: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-500'
  },

  warning: {
    bg: 'bg-amber-500', 
    text: 'text-amber-600',
    border: 'border-amber-500'
  }
};

/**
 * Fonction pour obtenir une couleur par token
 */
export function getColor(token: string): string {
  const keys = token.split('.');
  let value: any = CURELIAH_COLORS;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return '#000000'; // Fallback
  }
  
  return typeof value === 'string' ? value : '#000000';
}

/**
 * Utilitaire pour créer des variants de couleurs
 */
export function createColorVariant(baseColor: string, opacity: number): string {
  // Convertir hex en rgba
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Migration map pour remplacer automatiquement les anciennes classes
 */
export const COLOR_MIGRATION_MAP: Record<string, string> = {
  // Bleu
  'bg-blue-600': 'bg-medical-blue',
  'bg-blue-500': 'bg-medical-blue-light',
  'bg-blue-700': 'bg-medical-blue-dark',
  'text-blue-600': 'text-medical-blue',
  'text-blue-500': 'text-medical-blue-light',
  'border-blue-600': 'border-medical-blue',
  'hover:bg-blue-700': 'hover:bg-medical-blue-dark',
  'hover:text-blue-700': 'hover:text-medical-blue-dark',
  
  // Vert
  'bg-green-600': 'bg-medical-green',
  'bg-green-500': 'bg-medical-green-light', 
  'bg-green-700': 'bg-medical-green-dark',
  'text-green-600': 'text-medical-green',
  'text-green-500': 'text-medical-green-light',
  'border-green-600': 'border-medical-green',
  'hover:bg-green-700': 'hover:bg-medical-green-dark',
  'hover:text-green-700': 'hover:text-medical-green-dark',

  // Boutons et éléments d'interface courants
  'bg-indigo-600': 'bg-medical-blue',
  'bg-emerald-600': 'bg-medical-green',
  'bg-sky-600': 'bg-medical-blue-light',
  'bg-teal-600': 'bg-medical-green'
};

export default CURELIAH_COLORS;
