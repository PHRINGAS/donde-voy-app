import { Categoria, PlaceInput } from '../types';
import { parseDelimited } from '../utils/csv';
import { normalizeUrl } from '../utils/url';

// Portal actual: data.buenosaires.gob.ar (CKAN 2.11). El viejo
// datos.buenosaires.gob.ar ya no resuelve DNS.
const CKAN_BASE = 'https://data.buenosaires.gob.ar/api/3/action';

interface DatasetConfig {
  slug: string;
  categoria: Categoria;
  tipoBase: string;
  resourceMatch: RegExp;
}

const DATASETS: DatasetConfig[] = [
  {
    slug: 'oferta-establecimientos-gastronomicos',
    categoria: 'gastronomia',
    tipoBase: 'Gastronomia',
    resourceMatch: /oferta_gastronomica\.csv$/i,
  },
  {
    slug: 'espacios-culturales',
    categoria: 'cultura',
    tipoBase: 'Espacio Cultural',
    resourceMatch: /espacios-culturales\.csv$/i,
  },
];

interface CkanPackage {
  success?: boolean;
  result?: { resources?: Array<{ url: string; format: string }> };
}

export async function ingestCabaDatos(): Promise<{ places: PlaceInput[]; errores: string[] }> {
  const places: PlaceInput[] = [];
  const errores: string[] = [];

  for (const dataset of DATASETS) {
    try {
      const csvUrl = await resolveResourceUrl(dataset);
      const res = await fetch(csvUrl, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} descargando CSV`);

      const text = await res.text();
      const rows = parseDelimited(text, detectDelimiter(text));

      let kept = 0;
      rows.forEach((row, i) => {
        const place = rowToPlace(row, dataset, i);
        if (place) {
          places.push(place);
          kept++;
        }
      });

      console.log(`   📍 ${dataset.slug}: ${kept} lugares`);
    } catch (error) {
      const msg = `${dataset.slug}: ${(error as Error).message}`;
      errores.push(msg);
      console.warn(`   ⚠️ ${msg}`);
    }
  }

  return { places, errores };
}

async function resolveResourceUrl(dataset: DatasetConfig): Promise<string> {
  const res = await fetch(`${CKAN_BASE}/package_show?id=${dataset.slug}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en package_show`);

  const pkg = (await res.json()) as CkanPackage;
  const resource = pkg.result?.resources?.find(
    (r) => r.format?.toUpperCase() === 'CSV' && dataset.resourceMatch.test(r.url)
  );

  if (!resource) throw new Error('sin recurso CSV que coincida');
  return resource.url;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const semis = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semis >= commas ? ';' : ',';
}

type Row = Record<string, unknown>;

function rowToPlace(row: Row, dataset: DatasetConfig, index: number): PlaceInput | null {
  const nombre =
    pickString(row.nombre, row.NOMBRE, row.ESTABLECIMIENTO, row.denominacion);
  const lat = pickCoord(row.lat, row.LATITUD, row.latitud, row.y, row.Y);
  const lng = pickCoord(row.long, row.LONGITUD, row.longitud, row.x, row.X);

  if (!nombre || lat === null || lng === null) return null;
  if (!inBBox(lat, lng)) return null;

  const stableId = pickString(row.id, row.ID, row.fid, row.FID, row['Nº             REG']);
  const socialInstagram = cleanSocial(row.INSTAGRAM, row.instagram);
  const socialFacebook = cleanSocial(row.FACEBOOK, row.facebook);

  return {
    id: `caba:${dataset.slug}:${stableId ?? index}`,
    source: 'caba_datos',
    nombre,
    categoria: dataset.categoria,
    tipo:
      pickString(row.categoria, row.FUNCION_PRINCIPAL, row.SUBCATEGORIA) ??
      dataset.tipoBase,
    direccion:
      pickString(row.direccion_completa, row.DIRECCION, row.domicilio) ??
      joinAddress(row),
    barrio: pickString(row.barrio, row.BARRIO),
    partido: null,
    lat,
    lng,
    telefono: pickString(row.telefono, row.TELEFONO),
    web: normalizeUrlSafe(pickString(row.WEB, row.web)),
    instagram: socialInstagram,
    facebook: socialFacebook,
    horarios: buildHorarios(row),
    tags: row,
  };
}

function joinAddress(row: Row): string | null {
  const calle = pickString(row.CALLE, row.calle_nombre);
  const altura = pickString(row.ALTURA, row.calle_altura);
  if (!calle) return null;
  return altura ? `${calle} ${altura}` : calle;
}

function buildHorarios(row: Row): Record<string, unknown> | null {
  const raw = pickString(row.horario, row.HORARIO);
  return raw ? { raw } : null;
}

function cleanSocial(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) {
      const norm = normalizeUrl(v.startsWith('http') ? v : `https://instagram.com/${v.replace(/^@/, '')}`);
      return norm?.url.split('?')[0];
    }
  }
  return undefined;
}

function normalizeUrlSafe(url: string | null): string | null {
  if (!url) return null;
  return normalizeUrl(url)?.url ?? null;
}

function pickCoord(...values: unknown[]): number | null {
  for (const v of values) {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    if (Number.isFinite(n) && n !== 0) return n;
  }
  return null;
}

function inBBox(lat: number, lng: number): boolean {
  return lat > -35.2 && lat < -34.3 && lng > -59.1 && lng < -57.7;
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}
