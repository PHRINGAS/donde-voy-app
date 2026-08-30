import { env } from '../config';

/**
 * Cliente REST mínimo sobre PostgREST/Supabase.
 * Se usa fetch directo en lugar de supabase-js: mismos verbos, errores
 * legibles y cero dependencia de la capa de auth del SDK.
 */

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (env.supabaseServiceKey) {
    h['apikey'] = env.supabaseServiceKey;
    h['Authorization'] = `Bearer ${env.supabaseServiceKey}`;
  }
  return h;
}

async function unwrap(res: Response): Promise<Response> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  }
  return res;
}

export async function restSelect<T>(
  table: string,
  searchParams: string,
  limit?: number
): Promise<T[]> {
  const qp = new URLSearchParams(searchParams);
  if (limit) qp.set('limit', String(limit));
  const res = await fetch(`${env.supabaseUrl}/${table}?${qp.toString()}`, {
    headers: headers(),
    signal: AbortSignal.timeout(30000),
  });
  await unwrap(res);
  return (await res.json()) as T[];
}

export async function restUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  ignoreDuplicates = false
): Promise<number> {
  const prefer = ignoreDuplicates
    ? 'resolution=ignore-duplicates,return=representation'
    : 'resolution=merge-duplicates,return=representation';

  let lastError: unknown;

  // Reintento con chunks progresivamente menores: aisla filas problemáticas
  for (const size of [rows.length, 250, 50]) {
    if (size > rows.length) continue;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += size) {
      const part = rows.slice(i, i + size);
      try {
        const res = await fetch(
          `${env.supabaseUrl}/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
          {
            method: 'POST',
            headers: { ...headers(), Prefer: prefer },
            body: JSON.stringify(part),
            signal: AbortSignal.timeout(90000),
          }
        );
        await unwrap(res);
        const data = (await res.json()) as unknown[];
        inserted += Array.isArray(data) ? data.length : part.length;
      } catch (error) {
        lastError = error;
        if (size === rows.length) {
          inserted = 0;
          break; // reintenta todo con chunks más chicos
        }
        throw error;
      }
    }

    if (size === rows.length || inserted > 0) return inserted;
  }

  void lastError;
  return 0;
}

export async function restInsertReturning<T extends { id: unknown }>(
  table: string,
  row: Record<string, unknown>
): Promise<T | null> {
  const res = await fetch(`${env.supabaseUrl}/${table}`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(30000),
  });
  await unwrap(res);
  const data = (await res.json()) as T[];
  return data[0] ?? null;
}

export async function restUpdate(
  table: string,
  filters: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${env.supabaseUrl}/${table}?${filters}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(patch),
    signal: AbortSignal.timeout(30000),
  });
  await unwrap(res);
}
