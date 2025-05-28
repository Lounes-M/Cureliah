export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permissions: Json | null
          revoked_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          revoked_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          revoked_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          license_number: string
          speciality: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_verified?: boolean | null
          license_number: string
          speciality?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          license_number?: string
          speciality?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          category?: string
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          postal_code: string | null
          siret: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          postal_code?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          postal_code?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          related_booking_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          related_booking_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          related_booking_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          payer_id: string
          payment_method: string
          receiver_id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          payer_id: string
          payment_method?: string
          receiver_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          payer_id?: string
          payment_method?: string
          receiver_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          doctor_id: string
          establishment_id: string
          helpful_count: number | null
          id: string
          moderated_at: string | null
          moderation_notes: string | null
          moderator_id: string | null
          rating: number
          response: string | null
          response_date: string | null
          reviewer_type: string | null
          status: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          doctor_id: string
          establishment_id: string
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          rating: number
          response?: string | null
          response_date?: string | null
          reviewer_type?: string | null
          status?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          doctor_id?: string
          establishment_id?: string
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          rating?: number
          response?: string | null
          response_date?: string | null
          reviewer_type?: string | null
          status?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vacation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      vacation_bookings: {
        Row: {
          created_at: string | null
          doctor_id: string
          establishment_id: string
          id: string
          message: string | null
          payment_status: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number | null
          updated_at: string | null
          vacation_post_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          establishment_id: string
          id?: string
          message?: string | null
          payment_status?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vacation_post_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          establishment_id?: string
          id?: string
          message?: string | null
          payment_status?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vacation_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_bookings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_bookings_vacation_post_id_fkey"
            columns: ["vacation_post_id"]
            isOneToOne: false
            referencedRelation: "vacation_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_posts: {
        Row: {
          created_at: string | null
          description: string | null
          doctor_id: string
          end_date: string
          hourly_rate: number
          id: string
          location: string | null
          requirements: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          doctor_id: string
          end_date: string
          hourly_rate: number
          id?: string
          location?: string | null
          requirements?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          doctor_id?: string
          end_date?: string
          hourly_rate?: number
          id?: string
          location?: string | null
          requirements?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacation_posts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      establishment_type:
        | "hospital"
        | "clinic"
        | "private_practice"
        | "medical_center"
      speciality:
        | "cardiology"
        | "neurology"
        | "orthopedics"
        | "pediatrics"
        | "psychiatry"
        | "radiology"
        | "surgery"
        | "general_medicine"
        | "dermatology"
        | "gynecology"
      user_type: "doctor" | "establishment"
      vacation_status:
        | "available"
        | "booked"
        | "completed"
        | "cancelled"
        | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      establishment_type: [
        "hospital",
        "clinic",
        "private_practice",
        "medical_center",
      ],
      speciality: [
        "cardiology",
        "neurology",
        "orthopedics",
        "pediatrics",
        "psychiatry",
        "radiology",
        "surgery",
        "general_medicine",
        "dermatology",
        "gynecology",
      ],
      user_type: ["doctor", "establishment"],
      vacation_status: [
        "available",
        "booked",
        "completed",
        "cancelled",
        "pending",
      ],
    },
  },
} as const
