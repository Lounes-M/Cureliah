import { VacationStatus } from './database';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  event_type: string;
  booking_id: string | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  type: 'morning' | 'afternoon' | 'custom';
  start_time?: string;
  end_time?: string;
  vacation_id: string;
  created_at: string;
  updated_at: string;
}

export interface VacationBooking {
  id: string;
  vacation_post_id: string;
  doctor_id: string;
  establishment_id: string;
  status: VacationStatus;
  payment_status: string;
  message: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  vacation_posts: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    speciality: string;
    time_slots: TimeSlot[];
  };
  establishment_profiles: {
    id: string;
    name: string;
  };
}

export interface EventForm {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

export interface EventType {
  value: string;
  label: string;
  color: string;
}
