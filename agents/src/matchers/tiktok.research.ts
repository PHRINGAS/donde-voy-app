import { env } from '../config';
import { PlaceRow, VideoMatch } from '../types';

/**
 * TikTok Research API (https://developers.tiktok.com/products/research-api/).
 * Requiere aprobación de TikTok y su token en TIKTOK_RESEARCH_API_TOKEN.
 * Sin scraping: si no hay credenciales, este agente se omite limpiamente.
 */
export async function searchTikTokForPlace(place: PlaceRow): Promise<VideoMatch[]> {
  if (!env.tiktokResearchToken) return [];

  const ahora = new Date();
  const hace30d = new Date(ahora.getTime() - 30 * 24 * 3600 * 1000);

  const body = {
    query: {
      and: [
        { operation: 'IN', field_name: 'region_code', field_values: ['AR'] },
        { operation: 'IN', field_name: 'keyword', field_values: [place.nombre] },
      ],
    },
    start_date: fmt(hace30d),
    end_date: fmt(ahora),
    max_count: 10,
    cursor: 0,
    fields: 'id,video_description,create_time,author_username,like_count',
  };

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/research/video/query/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.tiktokResearchToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.warn(`   ⚠️ TikTok Research HTTP ${res.status} para "${place.nombre}"`);
      return [];
    }

    const json = (await res.json()) as {
      data?: {
        videos?: Array<{
          id: string;
          video_description?: string;
          create_time?: number;
          author_username?: string;
        }>;
      };
    };

    return (json.data?.videos ?? []).map((v) => ({
      platform: 'tiktok' as const,
      video_id: v.id,
      titulo: v.video_description?.slice(0, 300),
      canal: v.author_username,
      url: `https://www.tiktok.com/@${v.author_username}/video/${v.id}`,
      descripcion: v.video_description?.slice(0, 500),
      publicado_en: v.create_time ? new Date(v.create_time * 1000) : null,
      match_score: 3,
      match_method: 'tiktok_research_keyword',
    }));
  } catch (error) {
    console.warn(`   ⚠️ TikTok falló para "${place.nombre}": ${(error as Error).message}`);
    return [];
  }
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
