
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

export interface VacationBooking {
  id: string;
  vacation_post_id: string;
  establishment_id: string;
  doctor_id: string;
  status: string;
  created_at: string;
  vacation_posts: {
    title: string;
    start_date: string;
    end_date: string;
    location: string | null;
    speciality: string | null;
  };
  establishment_profiles: {
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
