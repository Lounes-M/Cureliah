// ===================================
// TYPES STRICTS POUR TOUTE L'APPLICATION
// ===================================

import { z } from 'zod';

// ===================================
// TYPES DE BASE STRICTS
// ===================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    user_type?: 'doctor' | 'establishment' | 'admin';
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
}

export interface Profile extends BaseEntity {
  id: string; // User ID
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'doctor' | 'establishment' | 'admin';
  is_verified: boolean;
}

// ===================================
// TYPES MÉDECIN STRICTS
// ===================================

export interface DoctorProfile extends BaseEntity {
  user_id: string;
  specialty: string;
  sub_specialties: string[];
  experience_years: number;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
    verified?: boolean;
  }>;
  languages: string[];
  bio: string | null;
  // Suppression du champ consultation_fee pour les médecins
  availability: {
    days: string[];
    hours: string;
  };
  license_number: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  rating: number; // 0-5
  total_reviews: number;
}

// ===================================
// TYPES ÉTABLISSEMENT STRICTS
// ===================================

export interface EstablishmentProfile extends BaseEntity {
  user_id: string;
  name: string;
  type: string;
  specialties: string[];
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  siret: string | null;
  description: string | null;
  services: string[];
  facilities: string[];
  staff_count: number;
  operating_hours: {
    days: string[];
    hours: string;
  };
  insurance_accepted: string[];
  payment_methods: string[];
  logo_url: string | null;
  is_verified: boolean;
  rating: number; // 0-5
  total_reviews: number;
}

// ===================================
// TYPES ABONNEMENTS STRICTS
// ===================================

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid';

export type PlanType = 'essentiel' | 'pro' | 'premium';

export interface UserSubscription extends BaseEntity {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: SubscriptionStatus;
  plan_type: PlanType;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

// ===================================
// TYPES MISSIONS PREMIUM STRICTS
// ===================================

export type MissionUrgency = 'normal' | 'high' | 'critical';
export type MissionStatus = 'draft' | 'published' | 'closed' | 'expired';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface PremiumMission extends BaseEntity {
  establishment_id: string;
  title: string;
  description: string;
  specialty: string;
  location: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  exclusive_until: string;
  salary_min: number; // en centimes
  salary_max: number; // en centimes
  spots_available: number;
  spots_filled: number;
  urgency: MissionUrgency;
  premium_perks: string[];
  priority_boost: boolean;
  status: MissionStatus;
  is_active: boolean;
  establishment_name: string | null; // dénormalisé
  establishment_rating: number | null;
  duration: string | null; // ex: "12h", "2 jours"
}

export interface PremiumMissionApplication extends BaseEntity {
  mission_id: string;
  doctor_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  expected_compensation: number | null; // en centimes
  availability_confirmed: boolean;
  applied_at: string;
  reviewed_at: string | null;
}

// ===================================
// TYPES NOTIFICATIONS STRICTS
// ===================================

export type NotificationType = 
  | 'mission_new' 
  | 'mission_application' 
  | 'mission_accepted' 
  | 'mission_rejected' 
  | 'payment' 
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification extends BaseEntity {
  recipient_id: string;
  recipient_type: 'doctor' | 'establishment';
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  priority: NotificationPriority;
  read: boolean;
  read_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

// ===================================
// TYPES DE FILTRES STRICTS
// ===================================

export interface PremiumMissionFilter {
  specialty?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  urgency?: MissionUrgency;
  available_spots_only?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface DoctorSearchFilter {
  specialty?: string;
  location?: string;
  experience_min?: number;
  languages?: string[];
  availability?: string;
  rating_min?: number;
}

export interface EstablishmentSearchFilter {
  type?: string;
  specialties?: string[];
  location?: string;
  services?: string[];
  rating_min?: number;
}

// ===================================
// TYPES API RESPONSES STRICTS
// ===================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count?: number;
  status: number;
  statusText: string;
}

// ===================================
// TYPES FORMULAIRES STRICTS
// ===================================

export interface DoctorProfileForm {
  specialty: string;
  sub_specialties: string[];
  experience_years: number;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  languages: string[];
  bio: string;
  // consultation_fee: number; // Removed for compliance
  availability: {
    days: string[];
    hours: string;
  };
  license_number: string;
}

export interface EstablishmentProfileForm {
  name: string;
  type: string;
  specialties: string[];
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  website: string;
  siret: string;
  description: string;
  services: string[];
  facilities: string[];
  staff_count: number;
  operating_hours: {
    days: string[];
    hours: string;
  };
  insurance_accepted: string[];
  payment_methods: string[];
}

export interface PremiumMissionForm {
  title: string;
  description: string;
  specialty: string;
  location: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  salary_min: number;
  salary_max: number;
  spots_available: number;
  urgency: MissionUrgency;
  premium_perks: string[];
  duration: string;
}

// ===================================
// TYPES COMPOSANTS STRICTS
// ===================================

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FilterState<T> {
  filters: T;
  applied: boolean;
  count: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ComponentType;
}

// ===================================
// SCHEMAS ZOD POUR VALIDATION
// ===================================

export const userSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  stripe_customer_id: z.string().min(1),
  stripe_subscription_id: z.string().min(1),
  stripe_price_id: z.string().min(1),
  status: z.enum(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid']),
  plan_type: z.enum(['essentiel', 'pro', 'premium']),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancel_at_period_end: z.boolean(),
  canceled_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const premiumMissionSchema = z.object({
  id: z.string().uuid(),
  establishment_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  specialty: z.string().min(1),
  location: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  application_deadline: z.string().datetime(),
  exclusive_until: z.string().datetime(),
  salary_min: z.number().int().positive(),
  salary_max: z.number().int().positive(),
  spots_available: z.number().int().positive(),
  spots_filled: z.number().int().nonnegative(),
  urgency: z.enum(['normal', 'high', 'critical']),
  premium_perks: z.array(z.string()),
  priority_boost: z.boolean(),
  status: z.enum(['draft', 'published', 'closed', 'expired']),
  is_active: z.boolean(),
  establishment_name: z.string().nullable(),
  establishment_rating: z.number().min(0).max(5).nullable(),
  duration: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const doctorProfileSchema = z.object({
  user_id: z.string().uuid(),
  specialty: z.string().min(1),
  sub_specialties: z.array(z.string()),
  experience_years: z.number().int().nonnegative().max(60),
  education: z.array(z.object({
    degree: z.string().min(1),
    institution: z.string().min(1),
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    verified: z.boolean().optional(),
  })),
  languages: z.array(z.string()),
  bio: z.string().max(1000).nullable(),
  // consultation_fee: z.number().int().nonnegative(), // Removed for compliance
  availability: z.object({
    days: z.array(z.string()),
    hours: z.string(),
  }),
  license_number: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  is_verified: z.boolean(),
  rating: z.number().min(0).max(5),
  total_reviews: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ===================================
// TYPE GUARDS POUR VALIDATION RUNTIME
// ===================================

export const isValidUser = (user: unknown): user is User => {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    typeof (user as User).id === 'string' &&
    typeof (user as User).email === 'string'
  );
};

export const isValidSubscription = (subscription: unknown): subscription is UserSubscription => {
  try {
    userSubscriptionSchema.parse(subscription);
    return true;
  } catch {
    return false;
  }
};

export const isValidPremiumMission = (mission: unknown): mission is PremiumMission => {
  try {
    premiumMissionSchema.parse(mission);
    return true;
  } catch {
    return false;
  }
};

// ===================================
// UTILITAIRES DE TYPES
// ===================================

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ===================================
// TYPES POUR HOOKS ET CONTEXT
// ===================================

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  doctorProfile: DoctorProfile | null;
  establishmentProfile: EstablishmentProfile | null;
  subscriptionPlan: PlanType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ===================================
// EXPORTS DÉJÀ DÉCLARÉS CI-DESSUS
// ===================================
