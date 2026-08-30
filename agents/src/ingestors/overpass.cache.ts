import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { env } from '../config';

const CACHE_DIR = join(process.cwd(), '.overpass-cache');

export function overpassCacheGet(query: string): unknown | null {
  if (env.dryRun) return null;
  const file = join(CACHE_DIR, `${hash(query)}.json`);
  if (!existsSync(file)) return null;

  try {
    const cached = JSON.parse(readFileSync(file, 'utf-8')) as {
      savedAt: number;
      ttlMs: number;
      data: unknown;
    };
    if (Date.now() - cached.savedAt > cached.ttlMs) return null;
    console.log('   ♻️ usando cache de Overpass');
    return cached.data;
  } catch {
    return null;
  }
}

export function overpassCacheSet(query: string, data: unknown, ttlHours = 24 * 6): void {
  if (env.dryRun) return;
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const file = join(CACHE_DIR, `${hash(query)}.json`);
    writeFileSync(
      file,
      JSON.stringify({ savedAt: Date.now(), ttlMs: ttlHours * 3600 * 1000, data })
    );
  } catch {
    // cache best-effort
  }
}

function hash(q: string): string {
  return createHash('sha1').update(q).digest('hex').slice(0, 24);
}
