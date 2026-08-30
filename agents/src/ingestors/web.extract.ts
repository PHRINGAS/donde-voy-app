import { Categoria, PlaceInput } from '../types';
import { normalizeUrl, sha1Short } from '../utils/url';

const JSONLD_TYPES_CATEGORIA: Record<string, Categoria> = {
  Restaurant: 'gastronomia',
  CafeOrCoffeeShop: 'gastronomia',
  FastFoodRestaurant: 'gastronomia',
  Bakery: 'gastronomia',
  Brewery: 'gastronomia',
  BarOrPub: 'bares',
  Bar: 'bares',
  Pub: 'bares',
  NightClub: 'noche',
  MovieTheater: 'cultura',
  TheaterEvent: 'cultura',
  Museum: 'cultura',
  ArtGallery: 'cultura',
  Library: 'cultura',
  MusicVenue: 'cultura',
  TouristAttraction: 'actividades',
  Aquarium: 'actividades',
  Zoo: 'actividades',
  AmusementPark: 'actividades',
  Park: 'actividades',
};

interface JsonLdNode {
  '@type'?: string | string[];
  name?: unknown;
  telephone?: unknown;
  url?: unknown;
  address?: unknown;
  geo?: { latitude?: unknown; longitude?: unknown; '@type'?: string };
  sameAs?: unknown;
  openingHours?: unknown;
}

export interface ExtractedPage {
  places: PlaceInput[];
  links: string[];
}

/** Extrae lugares (JSON-LD schema.org) y links internos de una página HTML. */
export function extractFromHtml(html: string, pageUrl: string, baseUrlHost: string): ExtractedPage {
  const places: PlaceInput[] = [];
  const links = new Set<string>();

  const jsonldBlocks = extractJsonLd(html);
  for (const node of jsonldBlocks.flatMap(flattenGraph)) {
    const place = nodeToPlace(node, pageUrl, baseUrlHost);
    if (place) places.push(place);
  }

  const linkRegex = /<a\s[^>]*href=["']([^"'#\s]+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null) {
    const norm = normalizeUrl(m[1]);
    if (!norm || norm.host !== baseUrlHost) continue;
    if (/\.(jpg|jpeg|png|gif|pdf|zip|css|js|webp|svg)$/i.test(norm.url)) continue;
    links.add(norm.url);
    if (links.size >= 80) break;
  }

  return { places, links: [...links] };
}

function extractJsonLd(html: string): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      nodes.push(JSON.parse(m[1].trim()));
    } catch {
      // JSON-LD malformado en la página: se ignora ese bloque
    }
  }
  return nodes;
}

function flattenGraph(node: JsonLdNode): JsonLdNode[] {
  if (Array.isArray(node)) return node.flatMap(flattenGraph);
  if (node && typeof node === 'object' && Array.isArray((node as { '@graph'?: JsonLdNode[] })['@graph'])) {
    return ((node as { '@graph': JsonLdNode[] })['@graph'] ?? []).flatMap(flattenGraph);
  }
  return [node];
}

function nodeToPlace(node: JsonLdNode, pageUrl: string, host: string): PlaceInput | null {
  if (!node || typeof node !== 'object') return null;

  const types = typeof node['@type'] === 'string' ? [node['@type']] : node['@type'] ?? [];
  const categoria = types.map((t) => JSONLD_TYPES_CATEGORIA[t]).find(Boolean);
  if (!categoria) return null;

  const nombre = str(node.name);
  if (!nombre || nombre.length < 3 || nombre.length > 120) return null;

  const lat = num(node.geo?.latitude);
  const lng = num(node.geo?.longitude);
  if (lat === null || lng === null) return null;
  if (!inBBox(lat, lng)) return null;

  const direccion = addressToString(node.address);

  return {
    id: `web:${sha1Short(`${host}|${nombre.toLowerCase()}|${direccion ?? ''}`)}`,
    source: 'web_crawl',
    source_url: pageUrl,
    nombre,
    categoria,
    tipo: types[0] ?? categoria,
    direccion,
    barrio: null,
    partido: localityOf(node.address),
    lat,
    lng,
    telefono: str(node.telephone),
    web: str(node.url) || undefined,
    instagram: socialFrom(node.sameAs, 'instagram'),
    facebook: socialFrom(node.sameAs, 'facebook'),
    horarios:
      typeof node.openingHours === 'string'
        ? { raw: node.openingHours }
        : Array.isArray(node.openingHours) && node.openingHours.length
          ? { raw: node.openingHours.join('; ') }
          : null,
    tags: {},
  };
}

function addressToString(addr: unknown): string | null {
  if (typeof addr === 'string') return addr;
  if (!addr || typeof addr !== 'object') return null;
  const a = addr as Record<string, unknown>;
  const calle = str(a.streetAddress);
  const localidad = str(a.addressLocality);
  return [calle, localidad].filter(Boolean).join(', ') || null;
}

function localityOf(addr: unknown): string | null {
  if (!addr || typeof addr !== 'object') return null;
  const a = addr as Record<string, unknown>;
  return str(a.addressRegion) === 'Buenos Aires' ? str(a.addressLocality) : str(a.addressRegion);
}

function socialFrom(sameAs: unknown, platform: string): string | undefined {
  const list = Array.isArray(sameAs) ? sameAs : typeof sameAs === 'string' ? [sameAs] : [];
  return list.find((u): u is string => typeof u === 'string' && u.includes(platform))?.split('?')[0];
}

function inBBox(lat: number, lng: number): boolean {
  return lat > -35.3 && lat < -34.2 && lng > -59.2 && lng < -57.6;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
