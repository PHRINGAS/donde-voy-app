import { env } from '../config';
import { PlaceInput, RunStats } from '../types';
import { toPlaceRow } from './normalize';
import { restInsertReturning, restSelect, restUpdate, restUpsert } from '../db/rest';

const CHUNK_SIZE = 500;

const PLACE_COLUMNS = [
  'id', 'source', 'source_url', 'nombre', 'nombre_normalizado', 'categoria', 'tipo',
  'direccion', 'barrio', 'partido', 'lat', 'lng', 'telefono', 'web', 'instagram',
  'facebook', 'horarios', 'tags',
] as const;

export async function upsertPlaces(_db: unknown, places: PlaceInput[]): Promise<RunStats> {
  const stats: RunStats = { inserted: 0, updated: 0, errors: 0, detalle: {} };

  // PostgREST (PGRST102): todas las filas del bulk deben tener EXACTAMENTE
  // las mismas claves; undefined se normaliza a null.
  const rows = places.map(toPlaceRow).map((row) => {
    const record: Record<string, unknown> = {};
    for (const col of PLACE_COLUMNS) {
      record[col] = row[col] === undefined ? null : row[col];
    }
    return record;
  });

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    if (env.dryRun) {
      stats.inserted += chunk.length;
      continue;
    }

    try {
      const n = await restUpsert('places', chunk, 'id');
      stats.inserted += n;
    } catch (error) {
      stats.errors += chunk.length;
      const e = error as Record<string, unknown>;
      console.error(
        `   ❌ chunk ${i}-${i + chunk.length}: name=${e?.constructor?.name} ` +
        `keys=[${Object.getOwnPropertyNames(e ?? {}).join(',')}] ` +
        `msg=${JSON.stringify(e?.message)} cause=${JSON.stringify(String((e as { cause?: unknown })?.cause ?? '').slice(0, 200))}`
      );
    }
  }

  return stats;
}

export async function startRun(_db: unknown, agent: string): Promise<number | null> {
  if (env.dryRun) return null;
  try {
    const run = await restInsertReturning<{ id: number }>('ingest_runs', { agent });
    return run?.id ?? null;
  } catch (error) {
    console.error(`⚠️ No se pudo registrar ingest_run: ${(error as Error).message}`);
    return null;
  }
}

export async function finishRun(
  _db: unknown,
  runId: number | null,
  status: 'success' | 'error',
  stats: RunStats
): Promise<void> {
  if (env.dryRun || !runId) return;
  try {
    await restUpdate(
      'ingest_runs',
      `id=eq.${runId}`,
      {
        finished_at: new Date().toISOString(),
        status,
        inserted: stats.inserted,
        updated: stats.updated,
        errors: stats.errors,
        detalle: stats.detalle,
      }
    );
  } catch (error) {
    console.error(`⚠️ No se pudo cerrar ingest_run: ${(error as Error).message}`);
  }
}

export async function countRows(table: string): Promise<number> {
  const rows = await restSelect<Record<string, unknown>>(table, 'select=id', 1);
  void rows;
  return 0;
}

export { restSelect };
