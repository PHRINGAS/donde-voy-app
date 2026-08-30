export type Categoria = 'gastronomia' | 'bares' | 'cultura' | 'actividades' | 'noche';

export interface PlaceInput {
  id: string;
  source: string;
  source_url?: string | null;
  nombre: string;
  categoria: Categoria;
  tipo: string;
  direccion?: string | null;
  barrio?: string | null;
  partido?: string | null;
  lat: number;
  lng: number;
  telefono?: string | null;
  web?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  horarios?: Record<string, unknown> | null;
  tags?: Record<string, unknown>;
}

export interface PlaceRow extends PlaceInput {
  nombre_normalizado: string;
  provincia: string;
  ubicacion?: unknown;
  video_count?: number;
  activo?: boolean;
  tags: Record<string, unknown>;
}

export type VideoPlatform = 'youtube' | 'tiktok' | 'instagram';

export interface VideoMatch {
  platform: VideoPlatform;
  video_id: string;
  titulo?: string;
  canal?: string;
  url: string;
  thumbnail_url?: string;
  descripcion?: string;
  publicado_en?: Date | null;
  match_score: number;
  match_method: string;
}

export interface RunStats {
  inserted: number;
  updated: number;
  errors: number;
  detalle: Record<string, unknown>;
}
