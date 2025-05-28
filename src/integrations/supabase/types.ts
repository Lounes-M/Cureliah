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
          speciality: Database["public"]["Enums"]["speciality"]
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
          speciality: Database["public"]["Enums"]["speciality"]
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
          speciality?: Database["public"]["Enums"]["speciality"]
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
      establishment_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          establishment_type: Database["public"]["Enums"]["establishment_type"]
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
          establishment_type: Database["public"]["Enums"]["establishment_type"]
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
          establishment_type?: Database["public"]["Enums"]["establishment_type"]
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
          user_type: Database["public"]["Enums"]["user_type"]
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
      vacation_bookings: {
        Row: {
          created_at: string | null
          doctor_id: string
          establishment_id: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["vacation_status"] | null
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
          status?: Database["public"]["Enums"]["vacation_status"] | null
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
          status?: Database["public"]["Enums"]["vacation_status"] | null
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
          speciality: Database["public"]["Enums"]["speciality"]
          start_date: string
          status: Database["public"]["Enums"]["vacation_status"] | null
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
          speciality: Database["public"]["Enums"]["speciality"]
          start_date: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
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
          speciality?: Database["public"]["Enums"]["speciality"]
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
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
      establishment_type:
        | "hospital"
        | "clinic"
        | "medical_center"
        | "nursing_home"
      speciality:
        | "general_medicine"
        | "cardiology"
        | "dermatology"
        | "pediatrics"
        | "surgery"
        | "radiology"
        | "anesthesia"
        | "emergency"
        | "psychiatry"
        | "gynecology"
      user_type: "doctor" | "establishment"
      vacation_status:
        | "available"
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
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
      establishment_type: [
        "hospital",
        "clinic",
        "medical_center",
        "nursing_home",
      ],
      speciality: [
        "general_medicine",
        "cardiology",
        "dermatology",
        "pediatrics",
        "surgery",
        "radiology",
        "anesthesia",
        "emergency",
        "psychiatry",
        "gynecology",
      ],
      user_type: ["doctor", "establishment"],
      vacation_status: [
        "available",
        "pending",
        "confirmed",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
