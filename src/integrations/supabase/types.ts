export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      adicionales: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_adicional: number
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_adicional?: never
          tipo: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_adicional?: never
          tipo?: string
        }
        Relationships: []
      }
      agrupamientos: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_agrupamiento: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_agrupamiento?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_agrupamiento?: never
        }
        Relationships: []
      }
      categorias: {
        Row: {
          codigo: string | null
          created_at: string
          descripcion: string
          estado: boolean
          id_categoria: number
          id_escalafon: number | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descripcion: string
          estado?: boolean
          id_categoria?: never
          id_escalafon?: number | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_categoria?: never
          id_escalafon?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_id_escalafon_fkey"
            columns: ["id_escalafon"]
            isOneToOne: false
            referencedRelation: "escalafones"
            referencedColumns: ["id_escalafon"]
          },
        ]
      }
      escalafones: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_escalafon: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_escalafon?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_escalafon?: never
        }
        Relationships: []
      }
      funciones: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_funcion: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_funcion?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_funcion?: never
        }
        Relationships: []
      }
      historial_laboral: {
        Row: {
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          fecha_movimiento: string
          id_historial: number
          id_legajo: number
          movimiento: string
          observaciones: string | null
          usuario: string | null
        }
        Insert: {
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          fecha_movimiento?: string
          id_historial?: never
          id_legajo: number
          movimiento: string
          observaciones?: string | null
          usuario?: string | null
        }
        Update: {
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          fecha_movimiento?: string
          id_historial?: never
          id_legajo?: number
          movimiento?: string
          observaciones?: string | null
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_laboral_id_legajo_fkey"
            columns: ["id_legajo"]
            isOneToOne: false
            referencedRelation: "legajo"
            referencedColumns: ["id_legajo"]
          },
          {
            foreignKeyName: "historial_laboral_id_legajo_fkey"
            columns: ["id_legajo"]
            isOneToOne: false
            referencedRelation: "v_legajos"
            referencedColumns: ["id_legajo"]
          },
          {
            foreignKeyName: "historial_laboral_id_legajo_fkey"
            columns: ["id_legajo"]
            isOneToOne: false
            referencedRelation: "v_planilla"
            referencedColumns: ["id_legajo"]
          },
        ]
      }
      legajo: {
        Row: {
          adic_mayor_horario: number | null
          adic_por_jefatura: number | null
          afectado: boolean
          afectado_tipo: string | null
          controlado: boolean
          controlado_at: string | null
          created_at: string
          dependencia: string | null
          fecha_desde: string | null
          fecha_hasta: string | null
          id_adic_jefatura: number | null
          id_adic_mayor_horario: number | null
          id_agrupamiento: number | null
          id_categoria: number | null
          id_funcion: number | null
          id_legajo: number
          id_lugar: number | null
          id_persona: number
          id_relacion_laboral: number | null
          id_sector: number | null
          id_udo: number | null
          observacion: string | null
          orden: number | null
          updated_at: string
          validacion: string | null
        }
        Insert: {
          adic_mayor_horario?: number | null
          adic_por_jefatura?: number | null
          afectado?: boolean
          afectado_tipo?: string | null
          controlado?: boolean
          controlado_at?: string | null
          created_at?: string
          dependencia?: string | null
          fecha_desde?: string | null
          fecha_hasta?: string | null
          id_adic_jefatura?: number | null
          id_adic_mayor_horario?: number | null
          id_agrupamiento?: number | null
          id_categoria?: number | null
          id_funcion?: number | null
          id_legajo?: never
          id_lugar?: number | null
          id_persona: number
          id_relacion_laboral?: number | null
          id_sector?: number | null
          id_udo?: number | null
          observacion?: string | null
          orden?: number | null
          updated_at?: string
          validacion?: string | null
        }
        Update: {
          adic_mayor_horario?: number | null
          adic_por_jefatura?: number | null
          afectado?: boolean
          afectado_tipo?: string | null
          controlado?: boolean
          controlado_at?: string | null
          created_at?: string
          dependencia?: string | null
          fecha_desde?: string | null
          fecha_hasta?: string | null
          id_adic_jefatura?: number | null
          id_adic_mayor_horario?: number | null
          id_agrupamiento?: number | null
          id_categoria?: number | null
          id_funcion?: number | null
          id_legajo?: never
          id_lugar?: number | null
          id_persona?: number
          id_relacion_laboral?: number | null
          id_sector?: number | null
          id_udo?: number | null
          observacion?: string | null
          orden?: number | null
          updated_at?: string
          validacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legajo_id_adic_jefatura_fkey"
            columns: ["id_adic_jefatura"]
            isOneToOne: false
            referencedRelation: "adicionales"
            referencedColumns: ["id_adicional"]
          },
          {
            foreignKeyName: "legajo_id_adic_mayor_horario_fkey"
            columns: ["id_adic_mayor_horario"]
            isOneToOne: false
            referencedRelation: "adicionales"
            referencedColumns: ["id_adicional"]
          },
          {
            foreignKeyName: "legajo_id_agrupamiento_fkey"
            columns: ["id_agrupamiento"]
            isOneToOne: false
            referencedRelation: "agrupamientos"
            referencedColumns: ["id_agrupamiento"]
          },
          {
            foreignKeyName: "legajo_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id_categoria"]
          },
          {
            foreignKeyName: "legajo_id_funcion_fkey"
            columns: ["id_funcion"]
            isOneToOne: false
            referencedRelation: "funciones"
            referencedColumns: ["id_funcion"]
          },
          {
            foreignKeyName: "legajo_id_lugar_fkey"
            columns: ["id_lugar"]
            isOneToOne: false
            referencedRelation: "lugares_trabajo"
            referencedColumns: ["id_lugar"]
          },
          {
            foreignKeyName: "legajo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "legajo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "v_legajos"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "legajo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "v_planilla"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "legajo_id_relacion_laboral_fkey"
            columns: ["id_relacion_laboral"]
            isOneToOne: false
            referencedRelation: "relaciones_laborales"
            referencedColumns: ["id_relacion_laboral"]
          },
          {
            foreignKeyName: "legajo_id_sector_fkey"
            columns: ["id_sector"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id_sector"]
          },
          {
            foreignKeyName: "legajo_id_udo_fkey"
            columns: ["id_udo"]
            isOneToOne: false
            referencedRelation: "udos_presupuestarias"
            referencedColumns: ["id_udo"]
          },
        ]
      }
      lugares_trabajo: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_lugar: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_lugar?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_lugar?: never
        }
        Relationships: []
      }
      opciones: {
        Row: {
          descripcion: string
          grupo: string
          id_opcion: number
        }
        Insert: {
          descripcion: string
          grupo: string
          id_opcion?: never
        }
        Update: {
          descripcion?: string
          grupo?: string
          id_opcion?: never
        }
        Relationships: []
      }
      personas: {
        Row: {
          apellido_nombre: string
          created_at: string
          cuil: string | null
          dni: string | null
          fecha_nacimiento: string | null
          id_persona: number
          id_titulo: number | null
          sexo: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          apellido_nombre: string
          created_at?: string
          cuil?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          id_persona?: never
          id_titulo?: number | null
          sexo?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          apellido_nombre?: string
          created_at?: string
          cuil?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          id_persona?: never
          id_titulo?: number | null
          sexo?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_id_titulo_fkey"
            columns: ["id_titulo"]
            isOneToOne: false
            referencedRelation: "titulos"
            referencedColumns: ["id_titulo"]
          },
        ]
      }
      relaciones_laborales: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_relacion_laboral: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_relacion_laboral?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_relacion_laboral?: never
        }
        Relationships: []
      }
      secretarias: {
        Row: {
          created_at: string
          estado: boolean
          id_secretaria: number
          id_udo: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: boolean
          id_secretaria?: never
          id_udo: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: boolean
          id_secretaria?: never
          id_udo?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretarias_id_udo_fkey"
            columns: ["id_udo"]
            isOneToOne: false
            referencedRelation: "udos_presupuestarias"
            referencedColumns: ["id_udo"]
          },
        ]
      }
      sectores: {
        Row: {
          created_at: string
          estado: boolean
          id_sector: number
          id_unidad: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: boolean
          id_sector?: never
          id_unidad: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: boolean
          id_sector?: never
          id_unidad?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectores_id_unidad_fkey"
            columns: ["id_unidad"]
            isOneToOne: false
            referencedRelation: "unidades_organizativas"
            referencedColumns: ["id_unidad"]
          },
        ]
      }
      titulos: {
        Row: {
          created_at: string
          descripcion: string
          estado: boolean
          id_titulo: number
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: boolean
          id_titulo?: never
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_titulo?: never
        }
        Relationships: []
      }
      udos_presupuestarias: {
        Row: {
          codigo: string | null
          created_at: string
          descripcion: string
          estado: boolean
          id_udo: number
          updated_at: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descripcion: string
          estado?: boolean
          id_udo?: never
          updated_at?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descripcion?: string
          estado?: boolean
          id_udo?: never
          updated_at?: string
        }
        Relationships: []
      }
      unidades_organizativas: {
        Row: {
          created_at: string
          estado: boolean
          id_secretaria: number
          id_unidad: number
          nombre: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: boolean
          id_secretaria: number
          id_unidad?: never
          nombre: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: boolean
          id_secretaria?: number
          id_unidad?: never
          nombre?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_organizativas_id_secretaria_fkey"
            columns: ["id_secretaria"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["id_secretaria"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_legajos: {
        Row: {
          apellido_nombre: string | null
          categoria: string | null
          controlado: boolean | null
          controlado_at: string | null
          cuil: string | null
          dni: string | null
          id_legajo: number | null
          id_persona: number | null
          orden: number | null
          secretaria: string | null
          sector: string | null
          udo: string | null
          udo_codigo: string | null
          unidad: string | null
        }
        Relationships: []
      }
      v_planilla: {
        Row: {
          apellido_nombre: string | null
          categoria: string | null
          controlado: boolean | null
          controlado_at: string | null
          cuil: string | null
          dni: string | null
          id_legajo: number | null
          id_persona: number | null
          lugar_trabajo: string | null
          orden: number | null
          udo: string | null
          udo_codigo: string | null
          validacion: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_read: { Args: { _u: string }; Returns: boolean }
      can_write: { Args: { _u: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "carga" | "consulta"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "carga", "consulta"],
    },
  },
} as const
