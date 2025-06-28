import { loadFeriasFromGeoJSON } from '../src/utils/dataProcessor';
import { feriasService } from '../src/integrations/supabase/feriasService';

async function syncFeriasToSupabase() {
    console.log('🔄 Iniciando sincronización de ferias con Supabase...');

    try {
        // Cargar datos del archivo GeoJSON
        console.log('📂 Cargando datos del archivo ferias_geo.json...');
        const geoJSONFerias = await loadFeriasFromGeoJSON();

        if (geoJSONFerias.length === 0) {
            console.error('❌ No se pudieron cargar datos del archivo GeoJSON');
            return;
        }

        console.log(`✅ Se cargaron ${geoJSONFerias.length} ferias del archivo GeoJSON`);

        // Sincronizar con Supabase
        console.log('🔄 Sincronizando con Supabase...');
        const result = await feriasService.syncFeriasFromGeoJSON(geoJSONFerias);

        console.log(`✅ Sincronización completada:`);
        console.log(`   - Ferias procesadas exitosamente: ${result.success}`);
        console.log(`   - Errores: ${result.errors}`);
        console.log(`   - Total: ${result.success + result.errors}`);

        if (result.errors > 0) {
            console.log('⚠️  Algunas ferias no se pudieron sincronizar. Revisa los logs para más detalles.');
        } else {
            console.log('🎉 ¡Todas las ferias se sincronizaron exitosamente!');
        }

        // Verificar que los datos estén en la base de datos
        console.log('🔍 Verificando datos en la base de datos...');
        const dbFerias = await feriasService.getAllFerias();
        console.log(`📊 Total de ferias en la base de datos: ${dbFerias.length}`);

        // Mostrar algunas estadísticas
        const tipos = new Set(dbFerias.map(f => f.tipo));
        const dias = new Set(dbFerias.flatMap(f => f.diasFuncionamiento));

        console.log('\n📈 Estadísticas:');
        console.log(`   - Tipos de feria: ${Array.from(tipos).join(', ')}`);
        console.log(`   - Días de funcionamiento: ${Array.from(dias).sort().join(', ')}`);

        // Mostrar algunas ferias de ejemplo
        console.log('\n📍 Ejemplos de ferias:');
        dbFerias.slice(0, 5).forEach(feria => {
            console.log(`   - ${feria.nombre} (${feria.tipo}) - ${feria.direccion}`);
        });

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
    }
}

// Ejecutar el script
syncFeriasToSupabase()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en el script:', error);
        process.exit(1);
    });

export { syncFeriasToSupabase }; 