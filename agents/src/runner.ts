import { env } from './config';
import { getDb } from './db/client';
void getDb;
import { ingestOsm } from './ingestors/osm.overpass';
import { ingestCabaDatos } from './ingestors/caba.datos';
import { ingestWeb } from './ingestors/web.crawler';
import { startRun, finishRun, upsertPlaces } from './pipeline/upsert';
import { matchVideos } from './matchers/matcher';
import { Categoria, RunStats } from './types';

interface Args {
  command: string;
  only?: string[];
  limit?: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const command = argv[0] ?? 'all';

  const onlyFlag = argv.find((a) => a.startsWith('--only='));
  const limitFlag = argv.find((a) => a.startsWith('--limit='));

  return {
    command,
    only: onlyFlag?.split('=')[1]?.split(','),
    limit: limitFlag ? Number(limitFlag.split('=')[1]) : undefined,
  };
}

async function runIngest(args: Args): Promise<void> {
  const db = getDb();
  const fuentes = args.only ?? ['osm', 'caba', 'web'];
  const totals: RunStats = { inserted: 0, updated: 0, errors: 0, detalle: {} };

  if (fuentes.includes('osm')) {
    console.log('🗺️  Ingestando OpenStreetMap (CABA + Conurbano)...');
    const runId = await startRun(db, 'osm_overpass');
    const categoriasFiltradas = args.only?.filter(isCategoria) as Categoria[] | undefined;
    const { places, statsByCategory } = await ingestOsm({
      categorias: categoriasFiltradas?.length ? categoriasFiltradas : undefined,
      limitPerCategory: args.limit,
    });
    const stats = await upsertPlaces(db, places);
    stats.detalle.por_categoria = statsByCategory;
    logStats('osm', stats);
    merge(totals, stats);
    await finishRun(db, runId, stats.errors > 0 && stats.inserted === 0 ? 'error' : 'success', stats);
  }

  if (fuentes.includes('caba')) {
    console.log('🏛️  Ingestando datos abiertos CABA...');
    const runId = await startRun(db, 'caba_datos');
    const { places, errores } = await ingestCabaDatos();
    console.log(`   📦 ${places.length} lugares parseados listos para upsert`);
    const stats = await upsertPlaces(db, places);
    stats.detalle.errores_fuentes = errores;
    if (errores.length > 0) stats.errors += errores.length;
    logStats('caba', stats);
    merge(totals, stats);
    await finishRun(db, runId, errores.length >= 1 && places.length === 0 ? 'error' : 'success', stats);
  }

  if (fuentes.includes('web')) {
    console.log('🌐 Descubrimiento activo en la web (SERP + JSON-LD)...');
    const runId = await startRun(db, 'web_discovery');
    const { places, stats: webStats } = await ingestWeb({
      maxQueries: args.limit ? Math.min(args.limit, 200) : undefined,
      maxPages: args.limit ? args.limit * 4 : undefined,
    });
    const stats = await upsertPlaces(db, places);
    stats.detalle = { ...stats.detalle, ...webStats };
    logStats('web', stats);
    merge(totals, stats);
    const falloTotal = stats.inserted === 0 && ((webStats.provider as string | null) === null);
    await finishRun(db, runId, falloTotal ? 'error' : 'success', stats);
  }

  console.log(`\n📊 Total ingesta → insertados/actualizados: ${totals.inserted}, errores: ${totals.errors}`);
}

async function runVideos(args: Args): Promise<void> {
  const db = getDb();
  const runId = await startRun(db, 'video_matcher');
  const stats = await matchVideos({ limit: args.limit, platforms: args.only });
  logStats('videos', stats);
  await finishRun(db, runId, stats.errors > 0 && stats.inserted === 0 ? 'error' : 'success', stats);
}

function isCategoria(v: string): v is Categoria {
  return ['gastronomia', 'bares', 'cultura', 'actividades', 'noche'].includes(v);
}

function logStats(agent: string, s: RunStats): void {
  console.log(`   → ${agent}: +${s.inserted} lugares, errores: ${s.errors}`);
}

function merge(target: RunStats, add: RunStats): void {
  target.inserted += add.inserted;
  target.updated += add.updated;
  target.errors += add.errors;
}

async function main() {
  const args = parseArgs();
  const inicio = Date.now();

  switch (args.command) {
    case 'ingest':
      await runIngest(args);
      break;
    case 'videos':
      await runVideos(args);
      break;
    case 'all':
      await runIngest(args);
      await runVideos(args);
      break;
    default:
      console.error('Uso: npm run agents -- <ingest|videos|all> [--only=osm,caba,web|youtube,tiktok] [--limit=N] [--dry-run]');
      process.exit(1);
  }

  console.log(`⏱️  Listo en ${((Date.now() - inicio) / 1000).toFixed(1)}s${env.dryRun ? ' (DRY RUN, nada se escribió)' : ''}`);
}

main().catch((e) => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
