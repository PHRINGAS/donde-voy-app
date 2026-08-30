-- ============================================================
-- 002: Alinear esquema `ferias` con el modelo de la app (Feria)
--      + función nearby_ferias (haversine puro, sin extensiones)
-- ============================================================

-- Columnas que la app usa y faltaban en 001
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Ferias';
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS etiquetas TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS horario_tipo TEXT;
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS frecuencia TEXT NOT NULL DEFAULT 'semanal';
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS especialidad TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ferias ADD COLUMN IF NOT EXISTS servicios TEXT[] NOT NULL DEFAULT '{}';

-- Backfill razonable para filas existentes
UPDATE public.ferias SET categoria = 'Ferias' WHERE categoria IS NULL OR categoria = '';
UPDATE public.ferias SET horario_tipo = 'todo_dia' WHERE horario_tipo IS NULL OR horario_tipo = '';

-- Índice para filtrar por categoría (usado por CategoryFilter / AppContext)
CREATE INDEX IF NOT EXISTS idx_ferias_categoria ON public.ferias(categoria);

-- La tabla es pública-solo-lectura por diseño.
-- Las escrituras (sync/admin) se hacen con la service_role key, que bypasea RLS.
-- No se crean políticas INSERT/UPDATE/DELETE para anon.

-- ------------------------------------------------------------
-- Búsqueda por cercanía SIN depender de cube/earthdistance.
-- Uso: SELECT * FROM nearby_ferias(-34.60, -58.38, 5000);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nearby_ferias(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_m DOUBLE PRECISION DEFAULT 5000
)
RETURNS SETOF public.ferias
LANGUAGE sql
STABLE
AS $$
    SELECT f.*
    FROM public.ferias f
    WHERE (
        6371000 * 2 * asin(
            sqrt(
                power(sin(radians(f.lat - p_lat) / 2), 2) +
                cos(radians(p_lat)) * cos(radians(f.lat)) *
                power(sin(radians(f.lng - p_lng) / 2), 2)
            )
        )
    ) <= p_radius_m
    ORDER BY (
        6371000 * 2 * asin(
            sqrt(
                power(sin(radians(f.lat - p_lat) / 2), 2) +
                cos(radians(p_lat)) * cos(radians(f.lat)) *
                power(sin(radians(f.lng - p_lng) / 2), 2)
            )
        )
    ) ASC;
$$;
