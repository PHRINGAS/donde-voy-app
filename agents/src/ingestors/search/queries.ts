export interface DiscoveryQuery {
  query: string;
  categoria: string;
  localidad: string;
}

const BARRIOS_CABA = [
  'Palermo', 'Recoleta', 'San Telmo', 'Belgrano', 'Almagro', 'Caballito',
  'Villa Crespo', 'Colegiales', 'Núñez', 'Flores', 'Boedo', 'Monserrat',
  'Retiro', 'Barracas', 'La Boca', 'Villa Urquiza', 'Saavedra', 'Villa Devoto',
  'Balvanera', 'Puerto Madero',
];

const PARTIDOS_CONURBANO = [
  'Vicente López', 'Olivos', 'San Isidro', 'Martínez', 'Tigre', 'San Fernando',
  'Morón', 'Ramos Mejía', 'Lanús', 'Avellaneda', 'Quilmes', 'Bernal',
  'Lomas de Zamora', 'Banfield', 'Temperley', 'San Martín', 'Caseros',
  'Ituzaingó', 'Castelar', 'Merlo', 'Moreno', 'San Justo', 'Florencio Varela',
  'Berazategui', 'Monte Grande', 'Ezeiza', 'Adrogué', 'San Miguel', 'Pilar',
  'Belén de Escobar', 'La Plata',
];

const TEMPLATES: Array<{ categoria: string; tpl: (l: string) => string }> = [
  { categoria: 'bares', tpl: (l) => `bares en ${l}` },
  { categoria: 'gastronomia', tpl: (l) => `restaurantes en ${l}` },
  { categoria: 'cultura', tpl: (l) => `teatros y centros culturales en ${l}` },
  { categoria: 'actividades', tpl: (l) => `actividades y lugares para visitar en ${l}` },
  { categoria: 'noche', tpl: (l) => `boliches y vida nocturna en ${l}` },
];

/**
 * Matriz de búsqueda determinista. En cada corrida se recorre desde un offset
 * rotativo (WEB_QUERY_OFFSET) para que semana a semana cubra distinta porción
 * del espacio de búsqueda sin repetir siempre lo mismo.
 */
export function generateQueries(maxQueries: number, offset = 0): DiscoveryQuery[] {
  const queries: DiscoveryQuery[] = [];
  const localidades = [...BARRIOS_CABA.map((b) => ({ n: b, esCaba: true })), ...PARTIDOS_CONURBANO.map((p) => ({ n: p, esCaba: false }))];

  for (const { n } of localidades) {
    for (const { categoria, tpl } of TEMPLATES) {
      queries.push({ query: tpl(n), categoria, localidad: n });
    }
  }

  if (offset > 0 && queries.length > 0) {
    const off = offset % queries.length;
    return [...queries.slice(off), ...queries.slice(0, off)].slice(0, maxQueries);
  }
  return queries.slice(0, maxQueries);
}
