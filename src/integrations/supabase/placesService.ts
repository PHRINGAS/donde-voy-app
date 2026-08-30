import { supabase } from './client';
import { Feria } from '../../types';

/**
 * Lee la base masiva `places` (agentes) y la adapta al modelo Feria de la UI.
 * La carga es SIEMPRE por cercanía con tope: la tabla puede tener cientos de
 * miles de filas, no se puede traer entera al cliente.
 */

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 }; // Obelisco

interface PlaceDbRow {
  id: string;
  source: string;
  source_url: string | null;
  nombre: string;
  categoria: string;
  tipo: string;
  direccion: string | null;
  barrio: string | null;
  partido: string | null;
  lat: number;
  lng: number;
  telefono: string | null;
  web: string | null;
  instagram: string | null;
  facebook: string | null;
  video_count: number | null;
}

export const CATEGORIA_LABEL: Record<string, string> = {
  gastronomia: 'Gastronomía',
  bares: 'Bares',
  cultura: 'Cultura',
  actividades: 'Actividades',
  noche: 'Noche',
};

export async function getNearbyPlacesAsFerias(
  lat: number = DEFAULT_CENTER.lat,
  lng: number = DEFAULT_CENTER.lng,
  radiusMeters = 20000,
  limit = 800
): Promise<Feria[]> {
  try {
    const { data, error } = await supabase.rpc('nearby_places', {
      p_lat: lat,
      p_lng: lng,
      p_radius_m: radiusMeters,
      p_categorias: null,
    });

    if (error) throw new Error(error.message);
    return ((data ?? []) as PlaceDbRow[])
      .slice(0, limit)
      .map(placeToFeria);
  } catch (error) {
    console.error('Error cargando places desde Supabase:', error);
    return [];
  }
}

export async function searchPlaces(query: string, limit = 20): Promise<Feria[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    // PostgREST ilike con % comodín; escapamos % y _ del input
    const esc = q.replace(/[%_]/g, '\\$&');
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .or(`nombre.ilike.%${esc}%,direccion.ilike.%${esc}%,barrio.ilike.%${esc}%`)
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as PlaceDbRow[]).map(placeToFeria);
  } catch (error) {
    console.error('searchPlaces:', error);
    return [];
  }
}

function placeToFeria(row: PlaceDbRow): Feria {
  const descripcionPartes = [
    row.direccion,
    row.barrio || row.partido,
    row.telefono ? `☎ ${row.telefono}` : null,
  ].filter(Boolean);

  return {
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion ?? '',
    lat: row.lat,
    lng: row.lng,
    tipo: row.tipo,
    categoria: CATEGORIA_LABEL[row.categoria] ?? 'Cultura',
    diasFuncionamiento: [],
    horarios: { apertura: '—', cierre: '—' },
    productos: [],
    descripcion: descripcionPartes.join(' · ') || undefined,
    telefono: row.telefono ?? undefined,
    barrio: row.barrio ?? undefined,
    comuna: row.partido ?? undefined,
    observaciones: row.web ?? undefined,
    etiquetas: [row.tipo],
    horarioTipo: 'todo_dia',
    frecuencia: 'semanal',
    especialidad: [],
    servicios: [],
    distancia: undefined,
  };
}
