export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      patient_access: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          patient_id: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          patient_id: string
          user_id: string
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          patient_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "simple_users"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          adresse: string | null
          ass_cnss: string | null
          cause_fin_dialyse: string | null
          cin: string | null
          created_at: string
          date_debut_dialyse: string | null
          date_fin_dialyse: string | null
          date_naiss: string | null
          gs: string | null
          id: string
          nom_complet: string
          profession: string | null
          sexe: string | null
          situa_fami: string | null
          tele: string | null
          tele_urg: string | null
          type: Database["public"]["Enums"]["patient_type"] | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          ass_cnss?: string | null
          cause_fin_dialyse?: string | null
          cin?: string | null
          created_at?: string
          date_debut_dialyse?: string | null
          date_fin_dialyse?: string | null
          date_naiss?: string | null
          gs?: string | null
          id?: string
          nom_complet: string
          profession?: string | null
          sexe?: string | null
          situa_fami?: string | null
          tele?: string | null
          tele_urg?: string | null
          type?: Database["public"]["Enums"]["patient_type"] | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          ass_cnss?: string | null
          cause_fin_dialyse?: string | null
          cin?: string | null
          created_at?: string
          date_debut_dialyse?: string | null
          date_fin_dialyse?: string | null
          date_naiss?: string | null
          gs?: string | null
          id?: string
          nom_complet?: string
          profession?: string | null
          sexe?: string | null
          situa_fami?: string | null
          tele?: string | null
          tele_urg?: string | null
          type?: Database["public"]["Enums"]["patient_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nom_complet: string
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom_complet: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom_complet?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simple_users: {
        Row: {
          created_at: string
          id: string
          password: string
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_created_patients: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_created_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create_new_patients: boolean | null
          can_view_all_patients: boolean | null
          created_at: string
          id: string
          permission_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create_new_patients?: boolean | null
          can_view_all_patients?: boolean | null
          created_at?: string
          id?: string
          permission_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create_new_patients?: boolean | null
          can_view_all_patients?: boolean | null
          created_at?: string
          id?: string
          permission_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "simple_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_user: {
        Args: { username_input: string; password_input: string }
        Returns: {
          user_id: string
          username: string
          role: string
        }[]
      }
      create_user: {
        Args:
          | {
              username_input: string
              password_input: string
              nom_complet_input: string
              role_input?: string
            }
          | {
              username_input: string
              password_input: string
              role_input?: string
            }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_config: {
        Args: { setting_name: string; setting_value: string; is_local: boolean }
        Returns: undefined
      }
      set_current_user: {
        Args: { username_value: string }
        Returns: undefined
      }
      set_session_id: {
        Args: { session_value: string }
        Returns: undefined
      }
      update_user_password: {
        Args: { username_input: string; new_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      patient_type:
        | "permanent"
        | "vacancier"
        | "transféré"
        | "décédé"
        | "greffé"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      patient_type: ["permanent", "vacancier", "transféré", "décédé", "greffé"],
    },
  },
} as const
