import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, requireSupabaseEnv } from '../config';

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!client) {
    if (env.dryRun) {
      // Cliente placeholder: nunca se usa para I/O real en --dry-run
      client = createClient('https://dry-run.placeholder', 'dry-run', {
        auth: { persistSession: false },
      });
    } else {
      requireSupabaseEnv();
      client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { persistSession: false },
      });
    }
  }
  return client;
}
