import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://wdkhfarsofyaofwonkjo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka2hmYXJzb2Z5YW9md29ua2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzI4MjcsImV4cCI6MjA2NjcwODgyN30.mzyTrMPk6isV0Sa2HX4fgnXUCxFF7STZFV8It9D4ljA";

// Stack local: PostgREST escucha en / (no en /rest/v1 como Supabase Cloud).
const isLocalStack = SUPABASE_URL.includes('localhost:3000');
const localFetch: typeof fetch = async (input, init) => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;
  if (isLocalStack && urlStr.includes('/rest/v1/')) {
    const fixed = urlStr.replace('/rest/v1/', '/');
    return fetch(fixed, init as RequestInit);
  }
  return fetch(input as RequestInfo, init);
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isLocalStack ? { global: { fetch: localFetch } } : undefined);
