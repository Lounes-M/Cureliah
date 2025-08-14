// Types pour les missions exclusives Premium
export interface PremiumMission {
  id: string;
  establishment_id: string;
  title: string;
  description: string;
  specialty?: string;
  location: string;
  
  // Dates et disponibilité
  start_date: string;
  end_date: string;
  application_deadline: string;
  exclusive_until: string;
  
  // Informations financières
  salary_min: number;
  salary_max: number;
  currency: string;
  
  // Caractéristiques premium
  urgency: 'high' | 'critical';
  duration: string;
  mission_type: 'urgent' | 'specialized' | 'vip' | 'emergency';
  
  // Avantages et exigences
  premium_perks: string[];
  benefits: string[];
  requirements: string[];
  
  // Disponibilités
  spots_available: number;
  spots_filled: number;
  
  // Informations établissement (dénormalisé)
  establishment_name?: string;
  establishment_rating: number;
  establishment_logo_url?: string;
  
  // Statut
  status: 'available' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  is_active: boolean;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
}

export interface PremiumMissionFilter {
  location?: string;
  specialty?: string;
  salary_min?: number;
  duration?: string;
  urgency?: 'high' | 'critical';
  mission_type?: 'urgent' | 'specialized' | 'vip' | 'emergency';
  available_spots_only?: boolean;
  establishment_rating_min?: number;
}

export interface PremiumMissionApplication {
  id: string;
  mission_id: string;
  doctor_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'interview_scheduled' | 'withdrawn';
  priority_score: number;
  cover_letter?: string;
  establishment_notes?: string;
  applied_at: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  decision_made_at?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les demandes urgentes d'établissements
export interface UrgentRequest {
  id: string;
  establishment_id: string;
  establishment_name?: string;
  establishment_logo?: string;
  establishment_rating?: number;
  title: string;
  description: string;
  specialty_required: string;
  urgency_level: 'medium' | 'high' | 'critical' | 'emergency';
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  hourly_rate: number;
  total_budget?: number;
  min_experience_years: number;
  required_certifications: string[];
  equipment_provided: boolean;
  transport_provided: boolean;
  accommodation_provided: boolean;
  priority_boost: boolean; // Premium feature
  featured: boolean; // Premium feature
  auto_accept_qualified: boolean;
  max_responses: number;
  status: 'open' | 'in_progress' | 'filled' | 'cancelled' | 'expired';
  expires_at: string;
  response_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface UrgentRequestResponse {
  id: string;
  request_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_rating: number;
  doctor_distance_km?: number;
  response_type: 'interested' | 'available' | 'maybe';
  availability_start: string;
  availability_end: string;
  message: string;
  requested_rate?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  response_time: number; // in minutes
  notes?: string; // Notes from establishment when accepting/rejecting
  created_at: string;
  updated_at: string;
}

export interface UrgentRequestNotification {
  id: string;
  request_id: string;
  recipient_id: string;
  recipient_type: 'doctor' | 'establishment';
  type: 'new_request' | 'new_response' | 'request_accepted' | 'request_cancelled' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
  expires_at?: string;
}
