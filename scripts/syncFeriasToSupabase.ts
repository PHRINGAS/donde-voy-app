/**
 * Sincroniza ferias_geo.json con Supabase.
 *
 * Requiere variables de entorno (NO usar la anon key, RLS bloquea escrituras):
 *   SUPABASE_URL=https://<proyecto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
 *
 * Uso: npm run sync-ferias
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processGeoJSONData, type GeoJSONData } from '../src/utils/dataProcessor';
import type { Feria } from '../src/types';

const CHUNK_SIZE = 500;

const feriaToRow = (feria: Feria) => ({
    id: feria.id,
    nombre: feria.nombre,
    direccion: feria.direccion,
    lat: feria.lat,
    lng: feria.lng,
    tipo: feria.tipo,
    categoria: feria.categoria || 'Ferias',
    dias_funcionamiento: feria.diasFuncionamiento,
    horarios: feria.horarios,
    productos: feria.productos,
    etiquetas: feria.etiquetas ?? [],
    horario_tipo: feria.horarioTipo ?? 'todo_dia',
    frecuencia: feria.frecuencia ?? 'semanal',
    especialidad: feria.especialidad ?? [],
    servicios: feria.servicios ?? [],
    descripcion: feria.descripcion ?? null,
    telefono: feria.telefono ?? null,
    barrio: feria.barrio ?? null,
    comuna: feria.comuna ?? null,
    observaciones: feria.observaciones ?? null
});

async function syncFeriasToSupabase() {
    console.log('🔄 Iniciando sincronización de ferias con Supabase...');

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
        console.error('   La anon key NO sirve: RLS solo permite lectura pública.');
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false }
    });

    // Cargar GeoJSON desde disco (fetch('/...') no funciona en Node)
    const geoPath = resolve(process.cwd(), 'public', 'ferias_geo.json');
    let geoJSONData: GeoJSONData;
    try {
        geoJSONData = JSON.parse(readFileSync(geoPath, 'utf-8'));
    } catch (error) {
        console.error(`❌ No se pudo leer ${geoPath}:`, error);
        process.exit(1);
    }

    const ferias = processGeoJSONData(geoJSONData);
    if (ferias.length === 0) {
        console.error('❌ El GeoJSON no produjo ferias procesables.');
        process.exit(1);
    }
    console.log(`✅ ${ferias.length} ferias procesadas desde ferias_geo.json`);

    // Upsert por lotes (idempotente, mucho más rápido que fila a fila)
    let success = 0;
    let errors = 0;
    for (let i = 0; i < ferias.length; i += CHUNK_SIZE) {
        const chunk = ferias.slice(i, i + CHUNK_SIZE).map(feriaToRow);
        const { error } = await supabase
            .from('ferias')
            .upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error en lote ${i}-${i + chunk.length}:`, error.message);
            errors += chunk.length;
        } else {
            success += chunk.length;
        }
    }

    console.log(`✅ Sincronización completada:`);
    console.log(`   - Exitosas: ${success}`);
    console.log(`   - Errores: ${errors}`);

    // Verificación
    const { count, error: countError } = await supabase
        .from('ferias')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('⚠️  No se pudo verificar el total:', countError.message);
    } else {
        console.log(`📊 Total de ferias en la base de datos: ${count}`);
    }
}

syncFeriasToSupabase()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en el script:', error);
        process.exit(1);
    });
