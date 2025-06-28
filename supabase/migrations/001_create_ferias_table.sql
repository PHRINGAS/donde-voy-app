-- Create ferias table
CREATE TABLE IF NOT EXISTS public.ferias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    tipo TEXT NOT NULL,
    dias_funcionamiento TEXT[] NOT NULL,
    horarios JSONB NOT NULL,
    productos TEXT[] NOT NULL,
    descripcion TEXT,
    telefono TEXT,
    barrio TEXT,
    comuna TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_ferias_location ON public.ferias USING GIST (
    ll_to_earth(lat, lng)
);

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_ferias_search ON public.ferias USING GIN (
    to_tsvector('spanish', nombre || ' ' || direccion || ' ' || COALESCE(descripcion, ''))
);

-- Create index for tipo and dias_funcionamiento
CREATE INDEX IF NOT EXISTS idx_ferias_tipo ON public.ferias(tipo);
CREATE INDEX IF NOT EXISTS idx_ferias_dias ON public.ferias USING GIN(dias_funcionamiento);

-- Enable Row Level Security
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.ferias
    FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ferias_updated_at 
    BEFORE UPDATE ON public.ferias 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 