import { env } from '../config';
import { Categoria, PlaceInput } from '../types';
import { overpassCacheGet, overpassCacheSet } from './overpass.cache';

const BBOX = '-35.05, -59.00, -34.40, -57.90'; // CABA + Conurbano + La Plata

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const USER_AGENT = 'DondeVoyAgent/1.0 (OSM data ingestion; https://github.com/PHRINGAS/donde-voy-app)';

const CATEGORY_FILTERS: Record<Categoria, string[]> = {
  gastronomia: ['nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"]'],
  bares: ['nwr["amenity"~"^(bar|pub|biergarten)$"]'],
  cultura: [
    'nwr["amenity"~"^(theatre|cinema|library|arts_centre|community_centre|music_venue)$"]',
    'nwr["tourism"~"^(museum|art_gallery|gallery)$"]',
  ],
  actividades: [
    'nwr["leisure"~"^(escape_game|bowling_alley|amusement_arcade|water_park|zoo|aquarium|sports_centre|stadium)$"]',
    'nwr["tourism"="attraction"]',
  ],
  noche: ['nwr["amenity"="nightclub"]'],
};

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OsmOptions {
  categorias?: Categoria[];
  limitPerCategory?: number;
}

export async function ingestOsm(options: OsmOptions = {}): Promise<{
  places: PlaceInput[];
  statsByCategory: Record<string, { fetched: number; kept: number }>;
}> {
  const categorias = options.categorias ?? (Object.keys(CATEGORY_FILTERS) as Categoria[]);
  const limit = options.limitPerCategory ?? env.osmCategoryLimit;
  const places: PlaceInput[] = [];
  const statsByCategory: Record<string, { fetched: number; kept: number }> = {};

  for (const categoria of categorias) {
    const query = buildQuery(categoria, limit);
    const elements = await fetchOverpass(query);
    let kept = 0;

    for (const el of elements) {
      if (limit && kept >= limit) break;
      const place = elementToPlace(el, categoria);
      if (!place) continue;
      places.push(place);
      kept++;
    }

    statsByCategory[categoria] = { fetched: elements.length, kept };
    console.log(`   📍 ${categoria}: ${kept} lugares (${elements.length} elementos crudos)`);

    // Cortesía con Overpass: evita rate-limit entre consultas grandes
    await sleep(2500);
  }

  return { places, statsByCategory };
}

function buildQuery(categoria: Categoria, limit?: number): string {
  const filters = CATEGORY_FILTERS[categoria].map((f) => `${f}(${BBOX});`).join('\n');
  const outClause = limit && limit > 0 ? `out center tags ${limit};` : 'out center tags;';
  return `[out:json][timeout:${env.overpassTimeoutS}];\n(\n${filters}\n);\n${outClause}`;
}

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  const cached = overpassCacheGet(query);
  if (cached) return cached as OverpassElement[];

  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': USER_AGENT,
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout((env.overpassTimeoutS + 30) * 1000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { elements?: OverpassElement[] };
        const elements = json.elements ?? [];
        overpassCacheSet(query, elements);
        return elements;
      } catch (error) {
        lastError = error;
        console.warn(`   ⚠️ ${endpoint} intento ${attempt}: ${(error as Error).message}`);
        // Backoff generoso: Overpass bloquea IPs que insisten
        await sleep(15000 * attempt);
      }
    }
    await sleep(8000);
  }

  console.error(`   ❌ Overpass falló para la categoría: ${(lastError as Error).message}`);
  return [];
}

function elementToPlace(el: OverpassElement, categoria: Categoria): PlaceInput | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};

  if (!lat || !lng || !tags.name?.trim()) return null;

  const tipo =
    tags.amenity ?? tags.tourism ?? tags.leisure ?? tags.historic ?? 'desconocido';

  return {
    id: `osm:${el.type[0]}/${el.id}`,
    source: 'osm',
    source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    nombre: tags.name.trim(),
    categoria,
    tipo,
    direccion: buildDireccion(tags),
    barrio: pick(tags['addr:suburb'], tags['addr:district'], tags['addr:neighbourhood']),
    partido: pick(tags['addr:municipality'], esCABA(tags) ? undefined : tags['addr:city']),
    lat,
    lng,
    telefono: pick(tags.phone, tags['contact:phone']),
    horarios: tags.opening_hours ? { raw: tags.opening_hours } : null,
    tags,
  };
}

function buildDireccion(tags: Record<string, string>): string | null {
  if (tags['addr:full']) return tags['addr:full'];
  const calle = tags['addr:street'];
  const altura = tags['addr:housenumber'];
  if (calle) return altura ? `${calle} ${altura}` : calle;
  return null;
}

function esCABA(tags: Record<string, string>): boolean {
  const city = (tags['addr:city'] ?? '').toLowerCase();
  return city.includes('buenos aires') || city.includes('caba');
}

function pick(...values: (string | undefined)[]): string | null {
  for (const v of values) {
    const trimmed = v?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
