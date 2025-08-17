// Types générés automatiquement par Supabase CLI
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          user_type: 'doctor' | 'establishment' | 'admin';
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type: 'doctor' | 'establishment' | 'admin';
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type?: 'doctor' | 'establishment' | 'admin';
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      doctor_profiles: {
        Row: {
          id: string;
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
          consultation_fee: number;
          availability: {
            days: string[];
            hours: string;
          };
          license_number: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['doctor_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['doctor_profiles']['Insert']>;
      };
      establishment_profiles: {
        Row: {
          id: string;
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
          rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['establishment_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['establishment_profiles']['Insert']>;
      };
      urgent_requests: {
        Row: {
          id: string;
          establishment_id: string;
          title: string;
          description: string;
          specialty_required: string;
          urgency_level: 'low' | 'medium' | 'high' | 'critical';
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          hourly_rate: number;
          total_budget: number | null;
          location: string | null;
          status: 'open' | 'in_progress' | 'filled' | 'cancelled' | 'expired';
          expires_at: string;
          featured: boolean;
          priority_boost: boolean;
          view_count: number;
          response_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['urgent_requests']['Row'], 'id' | 'view_count' | 'response_count' | 'created_at' | 'updated_at'> & {
          id?: string;
          view_count?: number;
          response_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['urgent_requests']['Insert']>;
      };
      urgent_request_responses: {
        Row: {
          id: string;
          request_id: string;
          doctor_id: string;
          doctor_name: string;
          doctor_specialty: string;
          doctor_rating: number;
          doctor_distance_km: number | null;
          response_type: 'available' | 'interested' | 'maybe';
          availability_start: string;
          availability_end: string;
          requested_rate: number | null;
          message: string;
          response_time: number;
          status: 'pending' | 'accepted' | 'rejected';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['urgent_request_responses']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['urgent_request_responses']['Insert']>;
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          credits_balance: number;
          total_purchased: number;
          total_spent: number;
          last_purchase_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_credits']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_credits']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'mission_new' | 'mission_application' | 'mission_accepted' | 'mission_rejected' | 'payment' | 'system';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          read: boolean;
          action_url: string | null;
          data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          url: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_type: 'doctor' | 'establishment' | 'admin';
      urgency_level: 'low' | 'medium' | 'high' | 'critical';
      request_status: 'open' | 'in_progress' | 'filled' | 'cancelled' | 'expired';
      response_status: 'pending' | 'accepted' | 'rejected';
      notification_type: 'mission_new' | 'mission_application' | 'mission_accepted' | 'mission_rejected' | 'payment' | 'system';
      notification_priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
};

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
