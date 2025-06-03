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

export type VacationStatus = 'draft' | 'available' | 'booked' | 'completed' | 'cancelled' | 'pending';

export type NotificationType = 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'booking_cancelled' | 'payment_success' | 'payment_failed' | 'system';

export type MessageType = 
  | 'text' 
  | 'file' 
  | 'voice' 
  | 'image'

export type UserStatus = 
  | 'online' 
  | 'offline' 
  | 'away'

export type EmailFrequency = 
  | 'immediate' 
  | 'daily' 
  | 'weekly' 
  | 'never'

export type ChatRole = 
  | 'admin' 
  | 'member'

export type TimeSlotType = 'morning' | 'afternoon' | 'custom';

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
  user_id: string
  first_name: string
  last_name: string
  speciality: Speciality
  profile_picture: string
  created_at: string
  updated_at: string
}

export interface EstablishmentProfile {
  id: string
  user_id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  siret: string
  profile_picture: string
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: string;
  vacation_id: string;
  type: TimeSlotType;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface VacationAvailability {
  id: string;
  vacation_id: string;
  date: string;
  time_slot_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface VacationPost {
  id: string;
  title: string;
  description: string;
  speciality: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location?: string;
  requirements?: string;
  doctor_id: string;
  status: VacationStatus;
  created_at: string;
  updated_at: string;
  time_slots: TimeSlot[];
  doctor_profiles?: {
    bio: string;
    experience_years: number;
    license_number: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface VacationBooking {
  id: string;
  vacation_post_id: string;
  establishment_id: string;
  doctor_id: string;
  message?: string;
  total_amount?: number;
  status: VacationStatus;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  selected_slots?: Array<{
    date: string;
    time_slot_id: string;
    hours: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read_at?: string;
  related_booking_id?: string;
  created_at: string;
}

export interface Message {
  id: string
  booking_id?: string
  group_id?: string
  sender_id: string
  receiver_id?: string
  content: string
  message_type: MessageType
  file_url?: string
  file_name?: string
  file_size?: number
  read_at?: string
  created_at: string
}

export interface UserPresence {
  id: string
  user_id: string
  status: UserStatus
  last_seen: string
  created_at: string
  updated_at: string
}

export interface ChatGroup {
  id: string
  name: string
  description?: string
  created_by: string
  booking_id?: string
  created_at: string
  updated_at: string
}

export interface ChatGroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  role: ChatRole
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_on_message: boolean
  email_on_booking_update: boolean
  email_on_review: boolean
  email_frequency: EmailFrequency
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  doctor_id: string
  establishment_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  payer_id: string
  receiver_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  stripe_payment_intent_id?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  vacation_id: string
  establishment_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  updated_at: string
}
