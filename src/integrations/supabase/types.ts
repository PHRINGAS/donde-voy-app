export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type FeriaRow = {
  id: string
  nombre: string
  direccion: string
  lat: number
  lng: number
  tipo: string
  categoria: string
  dias_funcionamiento: string[]
  horarios: Json
  productos: string[]
  etiquetas: string[]
  horario_tipo: string | null
  frecuencia: string
  especialidad: string[]
  servicios: string[]
  descripcion: string | null
  telefono: string | null
  barrio: string | null
  comuna: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      ferias: {
        Row: FeriaRow
        Insert: Partial<FeriaRow>
        Update: Partial<FeriaRow>
        Relationships: []
      }
      places: {
        Row: PlacesRow
        Insert: Partial<PlacesRow>
        Update: Partial<PlacesRow>
        Relationships: []
      }
      place_videos: {
        Row: PlaceVideoRow
        Insert: Partial<PlaceVideoRow>
        Update: Partial<PlaceVideoRow>
        Relationships: []
      }
      ingest_runs: {
        Row: IngestRunRow
        Insert: Partial<IngestRunRow>
        Update: Partial<IngestRunRow>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_ferias: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number }
        Returns: FeriaRow[]
      }
      nearby_places: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number; p_categorias?: string[] | null }
        Returns: PlacesRow[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PlacesRow = {
  id: string
  source: string
  source_url: string | null
  nombre: string
  nombre_normalizado: string
  categoria: string
  tipo: string
  direccion: string | null
  barrio: string | null
  partido: string | null
  provincia: string
  lat: number
  lng: number
  ubicacion: unknown
  telefono: string | null
  web: string | null
  instagram: string | null
  facebook: string | null
  horarios: Json | null
  tags: Json
  video_count: number
  activo: boolean
  created_at: string
  updated_at: string
}

type PlaceVideoRow = {
  id: string
  place_id: string
  platform: string
  video_id: string
  titulo: string | null
  canal: string | null
  url: string
  thumbnail_url: string | null
  descripcion: string | null
  publicado_en: string | null
  match_score: number
  match_method: string
  estado: string
  created_at: string
}

type IngestRunRow = {
  id: number
  agent: string
  started_at: string
  finished_at: string | null
  status: string
  inserted: number
  updated: number
  errors: number
  detalle: Json
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
    Enums: {},
  },
} as const
