
export type UserType = 'doctor' | 'establishment'

export type Speciality = 
  | 'cardiology' 
  | 'neurology' 
  | 'orthopedics' 
  | 'pediatrics' 
  | 'psychiatry' 
  | 'radiology' 
  | 'surgery' 
  | 'general_medicine' 
  | 'dermatology' 
  | 'gynecology'

export type EstablishmentType = 
  | 'hospital' 
  | 'clinic' 
  | 'private_practice' 
  | 'medical_center'

export type VacationStatus = 
  | 'available' 
  | 'booked' 
  | 'completed' 
  | 'cancelled'
  | 'pending'

export interface Profile {
  id: string
  user_type: UserType
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface DoctorProfile {
  id: string
  speciality: Speciality
  license_number: string
  experience_years?: number
  hourly_rate?: number
  bio?: string
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface EstablishmentProfile {
  id: string
  name: string
  establishment_type: EstablishmentType
  siret?: string
  address?: string
  city?: string
  postal_code?: string
  description?: string
  logo_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface VacationPost {
  id: string
  doctor_id: string
  title: string
  description?: string
  speciality: Speciality
  start_date: string
  end_date: string
  hourly_rate: number
  location?: string
  requirements?: string
  status: VacationStatus
  created_at: string
  updated_at: string
}

export interface VacationBooking {
  id: string
  vacation_post_id: string
  establishment_id: string
  doctor_id: string
  message?: string
  total_amount?: number
  status: VacationStatus
  created_at: string
  updated_at: string
}
