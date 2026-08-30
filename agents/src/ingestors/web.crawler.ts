import { env } from '../config';
import { PlaceInput } from '../types';
import { pickProvider, SearchResult } from './search/providers';
import { generateQueries } from './search/queries';
import { extractFromHtml } from './web.extract';
import { normalizeUrl, sha1Short } from '../utils/url';

const USER_AGENT = 'DondeVoyAgent/1.0 (+https://github.com/PHRINGAS/donde-voy-app; contacto via repo)';
const FETCH_TIMEOUT_MS = 12000;
const DELAY_MS = 350;
const MAX_CONCURRENT = 4;

export interface WebDiscoveryOptions {
  maxQueries?: number;
  maxPages?: number;
  queryOffset?: number;
}

export async function ingestWeb(options: WebDiscoveryOptions = {}): Promise<{
  places: PlaceInput[];
  stats: Record<string, unknown>;
}> {
  const provider = pickProvider();
  const maxQueries = options.maxQueries ?? Number(process.env.WEB_MAX_QUERIES ?? 60);
  const maxPages = options.maxPages ?? Number(process.env.WEB_MAX_PAGES ?? 250);
  const offset = options.queryOffset ?? Number(process.env.WEB_QUERY_OFFSET ?? 0);

  const stats: Record<string, unknown> = {
    provider: provider?.name ?? null,
    queries: 0,
    pages_fetched: 0,
    pages_failed: 0,
    seeds: 0,
    jsonld_places: 0,
    sin_geo: 0,
    bloqueados_robots: 0,
  };

  if (!provider) {
    console.log('   ⏭️  Sin proveedor de búsqueda configurado (BRAVE_API_KEY | TAVILY_API_KEY | GOOGLE_CSE_KEY+ID). Se omite descubrimiento web.');
    return { places: [], stats };
  }

  const queries = generateQueries(maxQueries, offset);
  stats.queries = queries.length;
  console.log(`   🔎 ${queries.length} búsquedas con proveedor "${provider.name}"...`);

  const seedUrls = new Map<string, { url: string; categoria?: string; localidad?: string }>();
  for (const q of queries) {
    try {
      const results: SearchResult[] = await provider.search(q.query, 8);
      results.forEach((r) => {
        const norm = normalizeUrl(r.url);
        if (norm && !/^(facebook|instagram|twitter|x)\./.test(norm.host)) {
          if (!seedUrls.has(norm.url)) {
            seedUrls.set(norm.url, { url: norm.url, categoria: q.categoria, localidad: q.localidad });
          }
        }
      });
    } catch (error) {
      stats.pages_failed = ((stats.pages_failed as number) ?? 0) + 1;
      console.warn(`   ⚠️ búsqueda falló ("${q.query}"): ${(error as Error).message}`);
    }
  }

  stats.seeds = seedUrls.size;
  const placesById = new Map<string, PlaceInput>();
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number; host: string }> = [...seedUrls.values()].map(
    (s) => ({ url: s.url, depth: 0, host: new URL(s.url).hostname })
  );

  while (queue.length > 0 && visited.size < maxPages) {
    const batch = queue.splice(0, MAX_CONCURRENT);
    await Promise.all(batch.map(async (job) => {
      if (visited.has(job.url) || visited.size >= maxPages) return;
      visited.add(job.url);

      if (!(await robotsAllows(job.host))) {
        stats.bloqueados_robots = ((stats.bloqueados_robots as number) ?? 0) + 1;
        return;
      }

      let html: string;
      try {
        const res = await fetch(job.url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('html')) return;
        html = await res.text();
        stats.pages_fetched = ((stats.pages_fetched as number) ?? 0) + 1;
      } catch (error) {
        stats.pages_failed = ((stats.pages_failed as number) ?? 0) + 1;
        void error;
        return;
      }

      const { places, links } = extractFromHtml(html, job.url, job.host);
      for (const place of places) {
        if (placesById.has(place.id)) continue;
        placesById.set(place.id, place);
        stats.jsonld_places = (stats.jsonld_places as number) + 1;
      }

      // Profundidad 1: seguir links internos de dominios que ya rindieron JSON-LD
      if (job.depth === 0 && (places.length > 0 || looksLikeDirectory(job.url)) && env.dryRun === false) {
        for (const link of links.slice(0, 25)) {
          if (!visited.has(link)) {
            queue.push({ url: link, depth: 1, host: job.host });
          }
        }
      }
    }));
    await sleep(DELAY_MS);
  }

  stats.sin_geo = 0;
  return { places: [...placesById.values()], stats };
}

function looksLikeDirectory(url: string): boolean {
  return /(bares|restaurant|gastronomia|teatro|cultura|actividades|guia|directorio)/i.test(url);
}

const robotsCache = new Map<string, boolean>();

async function robotsAllows(host: string): Promise<boolean> {
  if (robotsCache.has(host)) return robotsCache.get(host)!;

  let allowed = true;
  try {
    const res = await fetch(`https://${host}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const txt = await res.text();
      const uaBlock = txt.toLowerCase().split('\n');
      let appliesToUs = false;
      let disallowAll = false;
      for (const line of uaBlock) {
        const clean = line.trim();
        if (/^user-agent:/i.test(clean)) {
          appliesToUs = clean.includes('*') || clean.includes('dondevoyagent');
        } else if (appliesToUs && /^disallow:\s*\/\s*$/i.test(clean)) {
          disallowAll = true;
          break;
        }
      }
      allowed = !disallowAll;
    }
  } catch {
    allowed = true; // sin robots.txt accesible: se asume permitido
  }

  robotsCache.set(host, allowed);
  return allowed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
