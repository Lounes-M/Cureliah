// Types pour les missions exclusives Premium
export interface PremiumMission {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  duration: string;
  urgency: 'high' | 'critical';
  exclusive_until: string;
  premium_perks: string[];
  establishment_id: string;
  establishment_name: string;
  establishment_rating: number;
  requirements: string[];
  benefits: string[];
  application_deadline: string;
  spots_available: number;
  spots_filled: number;
  created_at: string;
  updated_at: string;
}

export interface PremiumMissionFilter {
  location?: string;
  speciality?: string;
  salary_min?: number;
  duration?: string;
  urgency?: 'high' | 'critical';
  available_spots_only?: boolean;
}

export interface PremiumMissionApplication {
  id: string;
  mission_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'interview_scheduled';
  application_date: string;
  priority_score: number; // Score de priorité basé sur l'abonnement Premium
  notes?: string;
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
