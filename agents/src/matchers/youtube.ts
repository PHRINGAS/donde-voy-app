import { env } from '../config';
import { PlaceRow, VideoMatch } from '../types';
import { normalizeNombre } from '../pipeline/normalize';

interface YtSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url: string }>;
    };
  }>;
}

export async function searchYoutubeForPlace(place: PlaceRow): Promise<VideoMatch[]> {
  if (!env.youtubeApiKey) return [];

  const lugar = [place.barrio, place.partido].filter(Boolean)[0] ?? '';
  const q = `${place.nombre} ${lugar}`.trim();

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '4');
  url.searchParams.set('regionCode', 'AR');
  url.searchParams.set('relevanceLanguage', 'es');
  url.searchParams.set('q', q);
  url.searchParams.set('key', env.youtubeApiKey);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as YtSearchResponse;

    return (json.items ?? [])
      .map((item) => mapVideo(item, place))
      .filter((v): v is VideoMatch => v !== null);
  } catch (error) {
    console.warn(`   ⚠️ YouTube falló para "${place.nombre}": ${(error as Error).message}`);
    return [];
  }
}

function mapVideo(item: NonNullable<YtSearchResponse['items']>[number], place: PlaceRow): VideoMatch | null {
  const videoId = item.id?.videoId;
  const title = item.snippet?.title;
  if (!videoId || !title) return null;

  const snip = item.snippet!;
  const nombreNorm = normalizeNombre(place.nombre);
  const tituloNorm = normalizeNombre(title);
  const contextoNorm = normalizeNombre(`${snip.description ?? ''} ${lugar(place)}`);
  const canalNorm = normalizeNombre(snip.channelTitle ?? '');

  let score = 0;
  let method = 'weak';

  if (tituloNorm.includes(nombreNorm)) {
    score += 3;
    method = 'name_in_title';
  }
  if (nombreNorm.split(' ').length > 1 && nombreNorm.split(' ').every((w) => tituloNorm.includes(w))) {
    score += 1;
    method = 'name_words_in_title';
  }
  if (canalNorm && (canalNorm.includes(nombreNorm) || nombreNorm.includes(canalNorm))) {
    score += 2;
    method = `${method}+channel`;
  }
  const zona = normalizeNombre(lugar(place));
  if (zona && contextoNorm.includes(zona)) score += 1;

  if (score < 2) return null;

  return {
    platform: 'youtube',
    video_id: videoId,
    titulo: title,
    canal: snip.channelTitle,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail_url: snip.thumbnails?.medium?.url ?? snip.thumbnails?.default?.url,
    descripcion: snip.description?.slice(0, 500),
    publicado_en: snip.publishedAt ? new Date(snip.publishedAt) : null,
    match_score: score,
    match_method: method,
  };
}

function lugar(place: PlaceRow): string {
  return [place.barrio, place.partido].filter(Boolean).join(' ');
}
