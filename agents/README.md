# Agentes de datos — Donde Voy

Sistema de agentes que construye y mantiene la base de lugares (bares,
restaurantes, teatros, centros culturales, actividades, vida nocturna) para
CABA + Conurbano bonaerense, y matchea videos de redes sociales a cada lugar.

## Fuentes

| Fuente | Qué aporta | Requiere |
|---|---|---|
| `osm` | Cientos de miles de POIs vía Overpass API (licencia ODbL) | Nada |
| `caba` | Bares Notables y datasets del portal CKAN de CABA | Nada |
| `web` | Descubrimiento activo: SERP + crawler con extracción JSON-LD (schema.org) | Brave / Tavily / Google CSE |
| `youtube` | Videos por lugar (YouTube Data API v3) | `YOUTUBE_API_KEY` |
| `tiktok` | Videos por lugar (Research API oficial, **sin scraping**) | Aprobación + token |

Todas las fuentes son opcionales entre sí y se degradan con gracia: si falta
una credencial, el agente se salta y lo deja registrado en `ingest_runs`.

## Uso

```bash
npm run agents -- ingest                    # osm + caba + web
npm run agents -- ingest --only=osm         # solo OSM
npm run agents -- ingest --only=web --limit=40
npm run agents -- videos                    # matching de videos
npm run agents -- all                       # ingesta completa + videos
npm run agents -- ingest --dry-run          # no escribe en la DB
```

Flags útiles:
- `--limit=N`: tope por categoría (OSM) o de búsquedas (web). Útil para tests.
- `--only=a,b`: restringe fuentes (ingesta) o plataformas (videos).

## Cron semanal

`.github/workflows/agents.yml` corre todo los lunes 09:00 UTC. Requiere estos
secrets en GitHub (`Settings → Secrets → Actions`):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY` (opcional pero recomendado)
- `BRAVE_API_KEY` o `TAVILY_API_KEY` o `GOOGLE_CSE_KEY`+`GOOGLE_CSE_ID`
- `TIKTOK_RESEARCH_API_TOKEN` (cuando TikTok apruebe el acceso)

El offset `WEB_QUERY_OFFSET = github.run_number` rota la matriz de búsquedas
(barrios/partidos × categorías) para cubrir terreno nuevo cada semana.

## Base de datos (Supabase)

Migración: `supabase/migrations/003_places_system.sql`

- `places`: catálogo unificado. ID estable por fuente (`osm:n/123`,
  `caba:<dataset>:<id>`, `web:<sha1>`), PostGIS para queries geográficas,
  índice trigram para detectar duplicados.
- `place_videos`: matches con score/método y estado
  (`auto_matched | pending_review | approved | rejected`).
- `ingest_runs`: auditoría de cada corrida.
- `nearby_places(lat, lng, radio_m, categorias[])`: función de cercanía.
- `possible_duplicate_places`: vista de candidatos a duplicado entre fuentes.

RLS: lectura pública; escritura solo con service role (los agentes).

## Límites y cortesía web

- El crawler respeta robots.txt (bloqueo global), User-Agent identificable,
  concurrencia 4, delay 350 ms, timeouts y topes duros de páginas/queries.
- Solo extrae JSON-LD schema.org publicado públicamente por cada sitio.
- Sin scraping de redes sociales: TikTok solo vía Research API oficial.

## Costos aproximados

- Overpass / CKAN: gratis.
- Brave Search: free tier 2k queries/mes. Tavily: free tier 1k/mes.
- YouTube Data API: 10k unidades/día gratis (~100 búsquedas/día).
- Google Places API NO se usa por costo (evitado a propósito).
