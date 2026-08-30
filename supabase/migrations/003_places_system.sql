-- ============================================================
-- 003: Sistema masivo de lugares (CABA + Conurbano)
--      Tablas: places, place_videos, ingest_runs
-- ============================================================

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- places: catálogo unificado de puntos de interés
-- id estable: 'osm:n/123', 'caba:bares-notables:45', etc.
-- ------------------------------------------------------------
create table if not exists public.places (
    id text primary key,
    source text not null,
    source_url text,
    nombre text not null,
    nombre_normalizado text not null,
    categoria text not null,
    tipo text not null,
    direccion text,
    barrio text,
    partido text,
    provincia text not null default 'Buenos Aires',
    lat double precision not null,
    lng double precision not null,
    ubicacion geography(point, 4326) generated always as (
        st_setsrid(st_makepoint(lng, lat), 4326)::geography
    ) stored,
    telefono text,
    web text,
    instagram text,
    facebook text,
    horarios jsonb,
    tags jsonb not null default '{}',
    video_count integer not null default 0,
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on column public.places.categoria is 'gastronomia | bares | cultura | actividades | noche';
comment on column public.places.id is '"osm:n/123", "osm:w/456", "caba:<dataset>:<id>"';

drop trigger if exists trg_places_updated_at on public.places;
create trigger trg_places_updated_at
    before update on public.places
    for each row execute function public.update_updated_at_column();

-- Georreferencia + índices de consulta frecuente
drop index if exists idx_places_ubicacion;
create index idx_places_ubicacion on public.places using gist (ubicacion);
create index idx_places_categoria on public.places (categoria);
create index idx_places_tipo on public.places (tipo);
create index idx_places_barrio on public.places (barrio) where barrio is not null;
create index idx_places_partido on public.places (partido) where partido is not null;
create index idx_places_fuente on public.places (source);

-- Deduplicación aproximada entre fuentes (revisión manual)
create index if not exists idx_places_nombre_trgm on public.places using gin (nombre_normalizado gin_trgm_ops);

-- RLS: lectura pública, escritura solo service role (agents)
alter table public.places enable row level security;
drop policy if exists "places_public_read" on public.places;
create policy "places_public_read" on public.places for select using (true);

-- ------------------------------------------------------------
-- place_videos: videos de redes sociales matcheados a lugares
-- ------------------------------------------------------------
create table if not exists public.place_videos (
    id text primary key,
    place_id text not null references public.places(id) on delete cascade,
    platform text not null,
    video_id text not null,
    titulo text,
    canal text,
    url text not null,
    thumbnail_url text,
    descripcion text,
    publicado_en timestamptz,
    match_score numeric not null default 0,
    match_method text not null default 'unknown',
    estado text not null default 'pending_review',
    created_at timestamptz not null default now(),
    unique (platform, video_id, place_id)
);

comment on column public.place_videos.estado is 'auto_matched | pending_review | approved | rejected';

create index idx_place_videos_place on public.place_videos (place_id);
create index idx_place_videos_estado on public.place_videos (estado) where estado in ('pending_review', 'auto_matched');

alter table public.place_videos enable row level security;
drop policy if exists "place_videos_public_read" on public.place_videos;
create policy "place_videos_public_read" on public.place_videos for select using (
    exists (select 1 from public.places p where p.id = place_id)
);

-- ------------------------------------------------------------
-- ingest_runs: auditoría de cada corrida de agentes
-- ------------------------------------------------------------
create table if not exists public.ingest_runs (
    id bigint generated always as identity primary key,
    agent text not null,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    status text not null default 'running',
    inserted integer not null default 0,
    updated integer not null default 0,
    errors integer not null default 0,
    detalle jsonb not null default '{}'
);

alter table public.ingest_runs enable row level security;
drop policy if exists "ingest_runs_admin_only" on public.ingest_runs;

-- ------------------------------------------------------------
-- Búsqueda por cercanía (radio en metros)
-- Uso: SELECT * FROM nearby_places(-34.60, -58.38, 2000, ARRAY['bares']);
-- ------------------------------------------------------------
create or replace function public.nearby_places(
    p_lat double precision,
    p_lng double precision,
    p_radius_m double precision default 2000,
    p_categorias text[] default null
)
returns setof public.places
language sql
stable
as $$
    select *
    from public.places
    where activo
      and (p_categorias is null or categoria = any (p_categorias))
      and st_dwithin(ubicacion, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
    order by ubicacion <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography;
$$;

-- Candidatos de duplicado entre fuentes (nombre similar a <400m)
create or replace view public.possible_duplicate_places as
select a.id as id_a, b.id as id_b,
       a.nombre as nombre_a, b.nombre as nombre_b,
       similarity(a.nombre_normalizado, b.nombre_normalizado) as similitud,
       st_distance(a.ubicacion, b.ubicacion) as distancia_m
from public.places a
join public.places b
  on a.id < b.id
 and a.categoria = b.categoria
 and similarity(a.nombre_normalizado, b.nombre_normalizado) > 0.55
 and st_dwithin(a.ubicacion, b.ubicacion, 400);
