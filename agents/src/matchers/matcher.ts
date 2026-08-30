import { env } from '../config';
import { PlaceRow, RunStats, VideoMatch } from '../types';
import { searchYoutubeForPlace } from './youtube';
import { searchTikTokForPlace } from './tiktok.research';
import { restSelect, restUpsert } from '../db/rest';

export interface MatcherOptions {
  limit?: number;
  platforms?: string[];
}

const VIDEO_COLUMNS = [
  'id', 'place_id', 'platform', 'video_id', 'titulo', 'canal', 'url',
  'thumbnail_url', 'descripcion', 'publicado_en', 'match_score', 'match_method', 'estado',
] as const;

export async function matchVideos(options: MatcherOptions = {}): Promise<RunStats> {
  const stats: RunStats = { inserted: 0, updated: 0, errors: 0, detalle: {} };
  const limit = options.limit ?? env.videoPlacesPerRun;

  const candidatos = await getCandidatePlaces(limit);
  console.log(`🎬 Matcheando videos para ${candidatos.length} lugares...`);
  stats.detalle.candidatos = candidatos.length;
  stats.detalle.tiktok_enabled = Boolean(env.tiktokResearchToken);

  for (const place of candidatos) {
    try {
      const matches: VideoMatch[] = [];

      if (!options.platforms || options.platforms.includes('youtube')) {
        matches.push(...(await searchYoutubeForPlace(place)));
      }
      if (env.tiktokResearchToken && (!options.platforms || options.platforms.includes('tiktok'))) {
        matches.push(...(await searchTikTokForPlace(place)));
      }

      if (matches.length > 0) {
        const rows = matches.map((m) => ({
          id: `${m.platform}:${m.video_id}:${place.id}`,
          place_id: place.id,
          platform: m.platform,
          video_id: m.video_id,
          titulo: m.titulo ?? null,
          canal: m.canal ?? null,
          url: m.url,
          thumbnail_url: m.thumbnail_url ?? null,
          descripcion: m.descripcion ?? null,
          publicado_en: m.publicado_en?.toISOString() ?? null,
          match_score: m.match_score,
          match_method: m.match_method,
          estado: m.match_score >= 3 ? 'auto_matched' : 'pending_review',
        }));

        if (!env.dryRun) {
          await restUpsert('place_videos', rows, 'id', true);
        }

        stats.inserted += rows.length;
        console.log(`   ✅ ${place.nombre}: ${rows.length} video(s)`);
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ ${place.nombre}: ${(error as Error).message}`);
    }
  }

  return stats;
}

async function getCandidatePlaces(limit: number): Promise<PlaceRow[]> {
  const conVideos = await restSelect<{ place_id: string }>('place_videos', 'select=place_id', 20000);
  const yaProcesados = new Set(conVideos.map((r) => r.place_id));

  const data = await restSelect<PlaceRow>(
    'places',
    'select=*',
    limit * 3
  );
  void data; // placeholder para mantener firma; se filtra abajo

  const recientes = await restSelect<PlaceRow>(
    'places',
    'select=id,nombre,categoria,tipo,direccion,barrio,partido,lat,lng,telefono,web,instagram,facebook&activo=eq.true&order=created_at.desc',
    limit * 3
  );

  return recientes.filter((p) => !yaProcesados.has(p.id)).slice(0, limit);
}
