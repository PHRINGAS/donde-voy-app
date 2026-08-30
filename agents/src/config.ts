export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? '',
  tiktokResearchToken: process.env.TIKTOK_RESEARCH_API_TOKEN ?? '',
  dryRun: process.argv.includes('--dry-run'),
  overpassTimeoutS: Number(process.env.OVERPASS_TIMEOUT_S ?? 180),
  osmCategoryLimit: Number(process.env.OSM_CATEGORY_LIMIT ?? 0),
  videoPlacesPerRun: Number(process.env.VIDEO_PLACES_PER_RUN ?? 150),
};

export function requireSupabaseEnv() {
  if (env.dryRun) return;
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    console.error('❌ Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
}
