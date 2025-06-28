import { supabase } from './client';
import { Feria } from '../../types';
import type { TablesInsert, TablesUpdate } from './types';

export interface FeriasService {
    getAllFerias(): Promise<Feria[]>;
    getFeriasByLocation(lat: number, lng: number, radiusKm: number): Promise<Feria[]>;
    getFeriasByTipo(tipo: string): Promise<Feria[]>;
    getFeriasByDia(dia: string): Promise<Feria[]>;
    searchFerias(query: string): Promise<Feria[]>;
    insertFeria(feria: TablesInsert<'ferias'>): Promise<Feria | null>;
    updateFeria(id: string, feria: TablesUpdate<'ferias'>): Promise<Feria | null>;
    deleteFeria(id: string): Promise<boolean>;
    syncFeriasFromGeoJSON(ferias: Feria[]): Promise<{ success: number; errors: number }>;
}

// Función para convertir Feria a formato de Supabase
const feriaToSupabase = (feria: Feria): TablesInsert<'ferias'> => ({
    id: feria.id,
    nombre: feria.nombre,
    direccion: feria.direccion,
    lat: feria.lat,
    lng: feria.lng,
    tipo: feria.tipo,
    dias_funcionamiento: feria.diasFuncionamiento,
    horarios: feria.horarios,
    productos: feria.productos,
    descripcion: feria.descripcion || null,
    telefono: feria.telefono || null,
    barrio: null, // Se puede extraer de la descripción si es necesario
    comuna: null, // Se puede extraer de la descripción si es necesario
    observaciones: null
});

// Función para convertir datos de Supabase a Feria
const supabaseToFeria = (row: any): Feria => ({
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    lat: row.lat,
    lng: row.lng,
    tipo: row.tipo,
    diasFuncionamiento: row.dias_funcionamiento,
    horarios: row.horarios,
    productos: row.productos,
    descripcion: row.descripcion,
    telefono: row.telefono,
    distancia: undefined // Se calcula dinámicamente
});

export const feriasService: FeriasService = {
    async getAllFerias(): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getAllFerias:', error);
            return [];
        }
    },

    async getFeriasByLocation(lat: number, lng: number, radiusKm: number): Promise<Feria[]> {
        try {
            // Usar la función earth_distance para calcular distancias
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .filter('earth_distance(ll_to_earth(lat, lng), ll_to_earth(?, ?))', 'lte', radiusKm * 1000)
                .order('earth_distance(ll_to_earth(lat, lng), ll_to_earth(?, ?))');

            if (error) {
                console.error('Error fetching ferias by location:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByLocation:', error);
            return [];
        }
    },

    async getFeriasByTipo(tipo: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .eq('tipo', tipo)
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias by tipo:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByTipo:', error);
            return [];
        }
    },

    async getFeriasByDia(dia: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .contains('dias_funcionamiento', [dia])
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias by dia:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByDia:', error);
            return [];
        }
    },

    async searchFerias(query: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .textSearch('nombre', query, {
                    type: 'websearch',
                    config: 'spanish'
                })
                .order('nombre');

            if (error) {
                console.error('Error searching ferias:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in searchFerias:', error);
            return [];
        }
    },

    async insertFeria(feria: TablesInsert<'ferias'>): Promise<Feria | null> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .insert(feria)
                .select()
                .single();

            if (error) {
                console.error('Error inserting feria:', error);
                return null;
            }

            return supabaseToFeria(data);
        } catch (error) {
            console.error('Error in insertFeria:', error);
            return null;
        }
    },

    async updateFeria(id: string, feria: TablesUpdate<'ferias'>): Promise<Feria | null> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .update(feria)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating feria:', error);
                return null;
            }

            return supabaseToFeria(data);
        } catch (error) {
            console.error('Error in updateFeria:', error);
            return null;
        }
    },

    async deleteFeria(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('ferias')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting feria:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteFeria:', error);
            return false;
        }
    },

    async syncFeriasFromGeoJSON(ferias: Feria[]): Promise<{ success: number; errors: number }> {
        let success = 0;
        let errors = 0;

        for (const feria of ferias) {
            try {
                const supabaseFeria = feriaToSupabase(feria);

                // Intentar insertar, si falla por duplicado, actualizar
                const { error: insertError } = await supabase
                    .from('ferias')
                    .insert(supabaseFeria);

                if (insertError) {
                    // Si es error de duplicado, intentar actualizar
                    if (insertError.code === '23505') { // Código de error de duplicado
                        const { error: updateError } = await supabase
                            .from('ferias')
                            .update(supabaseFeria)
                            .eq('id', feria.id);

                        if (updateError) {
                            console.error(`Error updating feria ${feria.id}:`, updateError);
                            errors++;
                        } else {
                            success++;
                        }
                    } else {
                        console.error(`Error inserting feria ${feria.id}:`, insertError);
                        errors++;
                    }
                } else {
                    success++;
                }
            } catch (error) {
                console.error(`Error processing feria ${feria.id}:`, error);
                errors++;
            }
        }

        return { success, errors };
    }
}; 